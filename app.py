import streamlit as st
import pandas as pd
from supabase import create_client, Client
from datetime import datetime
import os
import io

# Optional document generation libraries (with graceful fallbacks)
try:
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

try:
    from docx import Document
    from docx.shared import Pt
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

# ==============================================================================
# 1. STREAMLIT APP CONFIGURATION & PRINT MEDIA STYLES
# ==============================================================================
st.set_page_config(
    page_title="Cloud Inventory & POS Suite (BDT ৳)",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Print CSS for browser window.print() compatibility
st.markdown("""
<style>
@media print {
    header, footer, [data-testid="stSidebar"], .stDeployButton, .no-print {
        display: none !important;
    }
    .main, .block-container {
        padding: 0 !important;
        margin: 0 !important;
    }
    .printable-invoice {
        display: block !important;
        background: white !important;
        color: black !important;
    }
}
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# 2. CREDENTIALS & SUPABASE CLIENT INITIALIZATION
# ==============================================================================
try:
    SUPABASE_URL: str = st.secrets["SUPABASE_URL"]
    SUPABASE_KEY: str = st.secrets["SUPABASE_KEY"]
    SUPABASE_SERVICE_KEY: str = st.secrets["SUPABASE_SERVICE_KEY"]
except KeyError as e:
    st.error(
        f"Missing secret key: {e}. Please ensure '.streamlit/secrets.toml' "
        f"contains SUPABASE_URL, SUPABASE_KEY, and SUPABASE_SERVICE_KEY."
    )
    st.info("💡 In Streamlit Cloud (share.streamlit.io), configure these in App Settings -> Secrets.")
    st.stop()

@st.cache_resource
def get_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

@st.cache_resource
def get_admin_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

supabase = get_supabase_client()
supabase_admin = get_admin_supabase_client()

# ==============================================================================
# 3. SESSION STATE INITIALIZATION
# ==============================================================================
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "user_email" not in st.session_state:
    st.session_state.user_email = None
if "user_role" not in st.session_state:
    st.session_state.user_role = "User"
if "last_invoice" not in st.session_state:
    st.session_state.last_invoice = None
if "selected_cust_phone" not in st.session_state:
    st.session_state.selected_cust_phone = ""

# ==============================================================================
# 4. AUTHENTICATION HANDLERS
# ==============================================================================
def handle_login(email: str, password: str):
    if not email or not password:
        st.warning("Please provide both email and password.")
        return
    try:
        response = supabase.auth.sign_in_with_password({
            "email": email.strip(),
            "password": password
        })
        if response.user:
            st.session_state.logged_in = True
            st.session_state.user_email = response.user.email
            metadata = getattr(response.user, "user_metadata", {}) or {}
            st.session_state.user_role = metadata.get("role", "Cashier")
            st.success(f"Welcome back, {response.user.email}!")
            st.rerun()
    except Exception as e:
        st.error(f"Authentication failed: {str(e)}")

def handle_logout():
    try:
        supabase.auth.sign_out()
    except Exception:
        pass
    st.session_state.logged_in = False
    st.session_state.user_email = None
    st.session_state.user_role = "User"
    st.session_state.last_invoice = None
    st.rerun()

# ==============================================================================
# 5. STRICT AUTHENTICATION GUARD
# ==============================================================================
if not st.session_state.logged_in:
    st.markdown("<br><br>", unsafe_allow_html=True)
    c_left, c_center, c_right = st.columns([1, 2, 1])
    with c_center:
        st.markdown("""
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px;">📦</div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Cloud Inventory & POS Suite</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Multi-User Synced Enterprise Terminal · Currency: ৳ BDT</p>
        </div>
        """, unsafe_allow_html=True)

        with st.form("strict_login_form"):
            st.markdown("#### 🔒 Operator Sign-In")
            email_input = st.text_input("Operator Email Address", placeholder="operator@company.com")
            password_input = st.text_input("Password", type="password", placeholder="Enter secure password")
            submit_btn = st.form_submit_button("Access Management Suite", use_container_width=True, type="primary")

            if submit_btn:
                handle_login(email_input, password_input)

        st.info("💡 Default Seed Account: `admin@company.com` | Password: `adminpassword123`")
    st.stop()

# ==============================================================================
# 6. EXPORT UTILITIES (XLSX, PDF, DOCX)
# ==============================================================================
def export_df_to_excel(df: pd.DataFrame, sheet_name="Data") -> bytes:
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name=sheet_name)
    return output.getvalue()

def export_df_to_pdf(df: pd.DataFrame, title: str, subtitle: str = "") -> bytes:
    if not REPORTLAB_AVAILABLE:
        # Fallback to CSV text bytes if reportlab not installed
        return df.to_csv(index=False).encode("utf-8")
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph(f"<b>{title}</b>", styles["Title"]))
    if subtitle:
        elements.append(Paragraph(f"<font size=9 color=#64748b>{subtitle}</font>", styles["Normal"]))
    elements.append(Spacer(1, 15))

    col_names = [str(c) for c in df.columns]
    data_matrix = [col_names]
    for _, row in df.iterrows():
        data_matrix.append([str(v) for v in row.values])

    t = Table(data_matrix)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
    ]))
    elements.append(t)
    doc.build(elements)
    return buffer.getvalue()

def export_df_to_doc(df: pd.DataFrame, title: str) -> bytes:
    if not DOCX_AVAILABLE:
        # Fallback text representation
        output = io.StringIO()
        output.write(f"{title}\n{'=' * len(title)}\n\n")
        output.write(df.to_string(index=False))
        return output.getvalue().encode("utf-8")

    doc = Document()
    doc.add_heading(title, level=1)
    doc.add_paragraph(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Currency: ৳ BDT")

    t = doc.add_table(rows=1, cols=len(df.columns))
    t.style = 'Table Grid'
    hdr_cells = t.rows[0].cells
    for i, col in enumerate(df.columns):
        hdr_cells[i].text = str(col)

    for _, row in df.iterrows():
        row_cells = t.add_row().cells
        for i, val in enumerate(row.values):
            row_cells[i].text = str(val)

    bio = io.BytesIO()
    doc.save(bio)
    return bio.getvalue()

# ==============================================================================
# 7. DATABASE OPERATIONS (INVENTORY & SALES)
# ==============================================================================
def fetch_inventory_df() -> pd.DataFrame:
    try:
        res = supabase.table("inventory").select(
            "id, item_name, stock_level, price, shipment_code, buying_price, transport_cost, handling_cost, dispersed_transport, total_buying_cost, suggested_price, updated_by, last_updated"
        ).order("id", desc=False).execute()
        if res.data:
            df = pd.DataFrame(res.data)
            df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0.0)
            df["stock_level"] = pd.to_numeric(df["stock_level"], errors="coerce").fillna(0).astype(int)
            if "shipment_code" not in df.columns:
                df["shipment_code"] = "SHP-2026-01"
            else:
                df["shipment_code"] = df["shipment_code"].fillna("SHP-2026-01")
            if "buying_price" not in df.columns:
                df["buying_price"] = (df["price"] * 0.7).round(2)
            else:
                df["buying_price"] = pd.to_numeric(df["buying_price"], errors="coerce").fillna((df["price"] * 0.7).round(2))
            if "dispersed_transport" not in df.columns:
                df["dispersed_transport"] = 100.0
            else:
                df["dispersed_transport"] = pd.to_numeric(df["dispersed_transport"], errors="coerce").fillna(100.0)
            if "total_buying_cost" not in df.columns:
                df["total_buying_cost"] = (df["buying_price"] + df["dispersed_transport"]).round(2)
            else:
                df["total_buying_cost"] = pd.to_numeric(df["total_buying_cost"], errors="coerce").fillna(df["buying_price"] + df["dispersed_transport"]).round(2)
            return df
        return pd.DataFrame(columns=["id", "item_name", "stock_level", "price", "shipment_code", "buying_price", "dispersed_transport", "total_buying_cost", "updated_by", "last_updated"])
    except Exception as e:
        # Fallback to basic schema if new columns aren't yet populated
        try:
            res_basic = supabase.table("inventory").select("id, item_name, stock_level, price, updated_by, last_updated").order("id", desc=False).execute()
            if res_basic.data:
                df = pd.DataFrame(res_basic.data)
                df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0.0)
                df["stock_level"] = pd.to_numeric(df["stock_level"], errors="coerce").fillna(0).astype(int)
                df["shipment_code"] = "SHP-2026-01"
                df["buying_price"] = (df["price"] * 0.7).round(2)
                df["dispersed_transport"] = 100.0
                df["total_buying_cost"] = (df["buying_price"] + 100.0).round(2)
                return df
        except Exception:
            pass
        st.error(f"Error fetching inventory: {e}")
        return pd.DataFrame()

def fetch_sales_history_df() -> pd.DataFrame:
    try:
        res = supabase.table("sales").select(
            "id, receipt_number, item_id, quantity_sold, unit_price, subtotal_amount, transport_cost, total_amount, customer_name, customer_phone, customer_address, sale_date, processed_by, inventory(item_name)"
        ).order("sale_date", desc=True).execute()

        if res.data:
            formatted = []
            for row in res.data:
                inv_obj = row.get("inventory") or {}
                item_title = inv_obj.get("item_name", f"Item #{row.get('item_id')}")
                formatted.append({
                    "Receipt #": row.get("receipt_number") or f"INV-{row.get('id')}",
                    "Item": item_title,
                    "Qty": row.get("quantity_sold", 0),
                    "Unit Price (৳)": f"৳{float(row.get('unit_price', 0)):,.2f}",
                    "Subtotal (৳)": f"৳{float(row.get('subtotal_amount', 0)):,.2f}",
                    "Transport Cost (৳)": f"৳{float(row.get('transport_cost', 0)):,.2f}",
                    "Total Paid (৳)": f"৳{float(row.get('total_amount', 0)):,.2f}",
                    "Customer Name": row.get("customer_name", "Walk-in"),
                    "Customer Phone": row.get("customer_phone", ""),
                    "Customer Address": row.get("customer_address", ""),
                    "Sale Date": row.get("sale_date", "")[:19].replace("T", " "),
                    "Cashier": row.get("processed_by", "")
                })
            return pd.DataFrame(formatted)
        return pd.DataFrame()
    except Exception as e:
        st.error(f"Error fetching sales: {e}")
        return pd.DataFrame()

def fetch_previous_customers() -> list:
    """Extracts unique previous customer records from past sales for instant auto-fill."""
    try:
        res = supabase.table("sales").select("customer_phone, customer_name, customer_address").order("sale_date", desc=True).limit(100).execute()
        if not res.data:
            return []
        seen_phones = set()
        customers = []
        for row in res.data:
            p = str(row.get("customer_phone", "")).strip()
            if p and p not in seen_phones and p != "01700-000000":
                seen_phones.add(p)
                customers.append({
                    "phone": p,
                    "name": str(row.get("customer_name", "")).strip(),
                    "address": str(row.get("customer_address", "")).strip()
                })
        return customers
    except Exception:
        return []

def process_sale(
    item_id: int, 
    quantity: int, 
    current_stock: int, 
    item_name: str,
    unit_price: float,
    transport_cost: float,
    discount_amount: float,
    customer_name: str,
    customer_address: str,
    customer_phone: str
) -> bool:
    if quantity <= 0:
        st.error("Quantity sold must be greater than zero.")
        return False
    if quantity > current_stock:
        st.error(f"Insufficient stock for '{item_name}'! Available: {current_stock}, Requested: {quantity}")
        return False

    new_stock = current_stock - quantity
    timestamp_now = datetime.utcnow().isoformat()
    current_user = st.session_state.user_email
    subtotal = float(quantity * unit_price)
    total_amount = max(0.0, float(subtotal + transport_cost - discount_amount))
    receipt_no = f"INV-{datetime.now().strftime('%Y%m%d')}-{item_id}{int(datetime.now().timestamp()) % 1000:03d}"

    try:
        # Step 1: Deduct from inventory (inventory table stores item data only)
        supabase.table("inventory").update({
            "stock_level": new_stock,
            "updated_by": current_user,
            "last_updated": timestamp_now
        }).eq("id", item_id).execute()

        # Step 2: Insert into sales with Customer Details & Separate Transport Cost in ৳ BDT
        res = supabase.table("sales").insert({
            "item_id": item_id,
            "quantity_sold": quantity,
            "unit_price": unit_price,
            "subtotal_amount": subtotal,
            "transport_cost": transport_cost,
            "discount_amount": discount_amount,
            "total_amount": total_amount,
            "customer_name": customer_name.strip() if customer_name.strip() else "Walk-in Customer",
            "customer_address": customer_address.strip() if customer_address.strip() else "In-store Counter",
            "customer_phone": customer_phone.strip() if customer_phone.strip() else "01700-000000",
            "receipt_number": receipt_no,
            "sale_date": timestamp_now,
            "processed_by": current_user
        }).execute()

        # Save to session state for immediate printing in BDT
        st.session_state.last_invoice = {
            "sale_id": res.data[0]["id"] if res.data else "NEW",
            "receipt_number": receipt_no,
            "item_name": item_name,
            "quantity": quantity,
            "unit_price": unit_price,
            "subtotal": subtotal,
            "transport_cost": transport_cost,
            "discount_amount": discount_amount,
            "total_amount": total_amount,
            "customer_name": customer_name,
            "customer_address": customer_address,
            "customer_phone": customer_phone,
            "cashier": current_user,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        return True
    except Exception as e:
        st.error(f"Transaction failed: {e}")
        return False

def render_printable_invoice(inv: dict):
    """Renders a clean printable tax invoice with BDT currency and a direct window.print() button."""
    html_code = f"""
    <div style="background: white; color: #0f172a; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; font-family: sans-serif; max-width: 650px; margin: auto;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
            <div>
                <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a;">CLOUD INVENTORY & POS</h2>
                <div style="font-size: 11px; color: #64748b;">Commercial Sales & Logistics Terminal</div>
                <div style="font-size: 11px; color: #64748b;">Dhaka, Bangladesh · Currency: ৳ BDT</div>
            </div>
            <div style="text-align: right;">
                <span style="background: #ecfdf5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid #a7f3d0;">TAX INVOICE</span>
                <div style="font-size: 12px; font-weight: bold; margin-top: 4px;">{inv.get('receipt_number', f"INV-#{inv['sale_id']}")}</div>
                <div style="font-size: 11px; color: #64748b;">Date: {inv['date']}</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; background: #f8fafc; padding: 12px; border-radius: 8px;">
            <div>
                <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">BILLED & SHIPPED TO:</div>
                <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 2px;">{inv['customer_name']}</div>
                <div style="font-size: 12px; color: #475569;">📍 {inv['customer_address']}</div>
                <div style="font-size: 12px; color: #475569;">📞 {inv['customer_phone']}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">ORDER DETAILS:</div>
                <div style="font-size: 12px; color: #334155;">Cashier: <b>{inv['cashier']}</b></div>
                <div style="font-size: 12px; color: #059669; font-weight: bold;">Status: Paid / Delivered</div>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
            <thead>
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                    <th style="padding: 8px;">ITEM DESCRIPTION</th>
                    <th style="padding: 8px; text-align: center;">QTY</th>
                    <th style="padding: 8px; text-align: right;">UNIT PRICE</th>
                    <th style="padding: 8px; text-align: right;">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 8px; font-weight: 600;">{inv['item_name']}</td>
                    <td style="padding: 10px 8px; text-align: center;">{inv['quantity']}</td>
                    <td style="padding: 10px 8px; text-align: right;">৳{inv['unit_price']:,.2f}</td>
                    <td style="padding: 10px 8px; text-align: right; font-weight: bold;">৳{inv['subtotal']:,.2f}</td>
                </tr>
            </tbody>
        </table>

        <!-- Separate Shipment Transport Cost Calculation Breakdown -->
        <div style="margin-top: 16px; border-top: 2px solid #e2e8f0; padding-top: 8px; text-align: right; font-size: 12px;">
            <div style="display: flex; justify-content: flex-end; gap: 24px; color: #475569; margin-bottom: 4px;">
                <span>Subtotal:</span>
                <span style="font-family: monospace; font-weight: 600;">৳{inv['subtotal']:,.2f}</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 24px; color: #0284c7; margin-bottom: 4px;">
                <span>Shipment & Transport Fee (Calculated Separately):</span>
                <span style="font-family: monospace; font-weight: bold;">+ ৳{inv['transport_cost']:,.2f}</span>
            </div>
            {f'''<div style="display: flex; justify-content: flex-end; gap: 24px; color: #d97706; margin-bottom: 4px;">
                <span>Discount / Promo:</span>
                <span style="font-family: monospace; font-weight: bold;">- ৳{inv['discount_amount']:,.2f}</span>
            </div>''' if inv.get('discount_amount', 0) > 0 else ''}
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 6px;">
                TOTAL DUE (BDT): <span style="color: #059669;">৳{inv['total_amount']:,.2f} BDT</span>
            </div>
        </div>

        <div style="margin-top: 24px; text-align: center;">
            <button onclick="window.print()" style="background: #10b981; color: #022c22; font-weight: bold; padding: 10px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px;">
                🖨️ Print Invoice (window.print)
            </button>
        </div>
    </div>
    """
    st.components.v1.html(html_code, height=480, scrolling=True)

# ==============================================================================
# 8. LEGACY DATA MIGRATION FUNCTION
# ==============================================================================
def migrate_legacy_excel(filepath: str = "Inventory_Tracker.xlsx") -> int:
    """
    Reads from an existing local Excel file referenced verbatim as 'Inventory_Tracker.xlsx'
    and performs a bulk insert of its data into the Supabase inventory table using Pandas.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File '{filepath}' not found.")
    
    df = pd.read_excel(filepath)
    required_cols = {"item_name", "stock_level", "price"}
    if not required_cols.issubset(set(df.columns)):
        raise ValueError(f"Excel file missing required columns: {required_cols - set(df.columns)}")

    records_to_insert = []
    current_user = st.session_state.user_email or "System Migration"
    timestamp_now = datetime.utcnow().isoformat()

    for _, row in df.iterrows():
        records_to_insert.append({
            "item_name": str(row["item_name"]).strip(),
            "stock_level": int(row["stock_level"]),
            "price": float(row["price"]),
            "updated_by": current_user,
            "last_updated": timestamp_now
        })

    if records_to_insert:
        supabase.table("inventory").insert(records_to_insert).execute()
    return len(records_to_insert)

# ==============================================================================
# 9. SIDEBAR NAVIGATION
# ==============================================================================
with st.sidebar:
    st.markdown("### 📦 Cloud Inventory")
    st.markdown(f"**Operator:** `{st.session_state.user_email}`")
    st.caption(f"Role: **{st.session_state.user_role}** · Currency: **৳ BDT**")
    
    st.divider()
    page = st.radio(
        "Navigation Menu",
        ["Dashboard & Search", "Sales (POS) & Print", "Inventory Management", "Admin Panel", "Download app.py"],
        index=0
    )
    
    st.divider()
    if st.button("🚪 Log Out", use_container_width=True, type="secondary"):
        handle_logout()

# ==============================================================================
# 10. VIEW: DASHBOARD & SEARCH (WITH EXPORTS IN BDT)
# ==============================================================================
if page == "Dashboard & Search":
    st.title("📊 Inventory Dashboard & Product Search")
    st.caption("Live synced state with multi-format exports (Currency: Bangladeshi Taka ৳ BDT)")

    df_inv = fetch_inventory_df()

    if not df_inv.empty:
        total_items = len(df_inv)
        total_stock = df_inv["stock_level"].sum()
        total_value = (df_inv["stock_level"] * df_inv["price"]).sum()
        low_stock_df = df_inv[df_inv["stock_level"] < 10]

        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Catalog SKUs", f"{total_items:,}")
        c2.metric("Total Stock Units", f"{total_stock:,}")
        c3.metric("Inventory Valuation", f"৳{total_value:,.2f}")
        c4.metric("Low Stock Alerts", f"{len(low_stock_df)}", delta="-Attention" if len(low_stock_df) > 0 else "Normal")

        # Search Filters
        st.subheader("🔍 Search Catalog Items")
        search_col1, search_col2, search_col3 = st.columns([2, 1, 1])

        with search_col1:
            search_query = st.text_input("Filter products by title or ID", placeholder="Search item title...")
        with search_col2:
            stock_filter = st.selectbox("Stock Filter", ["All Items", "Low Stock (<10)", "In Stock (>0)", "Out of Stock (=0)"])
        with search_col3:
            max_price = float(df_inv["price"].max()) if not df_inv.empty else 5000.0
            price_limit = st.slider("Max Price (৳ BDT)", min_value=0.0, max_value=max(1000.0, max_price), value=max(1000.0, max_price), step=50.0)

        filtered_df = df_inv.copy()
        if search_query:
            filtered_df = filtered_df[
                filtered_df["item_name"].astype(str).str.contains(search_query, case=False, na=False) |
                filtered_df["id"].astype(str).str.contains(search_query, case=False, na=False)
            ]

        if stock_filter == "Low Stock (<10)":
            filtered_df = filtered_df[filtered_df["stock_level"] < 10]
        elif stock_filter == "In Stock (>0)":
            filtered_df = filtered_df[filtered_df["stock_level"] > 0]
        elif stock_filter == "Out of Stock (=0)":
            filtered_df = filtered_df[filtered_df["stock_level"] == 0]

        filtered_df = filtered_df[filtered_df["price"] <= price_limit]

        # Display catalog table
        st.dataframe(filtered_df, use_container_width=True, hide_index=True)

        # Multi-Format Export Options
        st.markdown("#### 📥 Export Inventory Data")
        exp_c1, exp_c2, exp_c3 = st.columns(3)

        with exp_c1:
            st.download_button(
                label="📄 Export to Excel (.xlsx)",
                data=export_df_to_excel(filtered_df, sheet_name="Inventory"),
                file_name=f"inventory_{datetime.now().strftime('%Y%m%d')}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True
            )
        with exp_c2:
            st.download_button(
                label="📑 Export to PDF (.pdf)",
                data=export_df_to_pdf(filtered_df, "Inventory Valuation Report", f"Currency: Bangladeshi Taka (৳ BDT) | Items: {len(filtered_df)}"),
                file_name=f"inventory_{datetime.now().strftime('%Y%m%d')}.pdf",
                mime="application/pdf",
                use_container_width=True
            )
        with exp_c3:
            st.download_button(
                label="📝 Export to Word (.doc)",
                data=export_df_to_doc(filtered_df, "Inventory Report (BDT)"),
                file_name=f"inventory_{datetime.now().strftime('%Y%m%d')}.doc",
                mime="application/msword",
                use_container_width=True
            )
    else:
        st.info("No items in inventory. Go to 'Inventory Management' to add items.")

# ==============================================================================
# 11. VIEW: POINT OF SALE (POS), CUSTOMER AUTOFILL, TRANSPORT COSTS & PRINTING
# ==============================================================================
elif page == "Sales (POS) & Print":
    st.title("🛒 Point of Sale & Invoicing")
    st.caption("Customer info is captured ONLY here. Phone auto-fills previous customers. Currency: ৳ BDT.")

    # CLARIFICATION BANNER ON MULTIPLE SHIPMENTS & TRANSPORT COSTS
    with st.expander("🚚 **Clarification: How Multiple Shipments and Transport Costs Calculate Separately**", expanded=False):
        st.markdown("""
        **Yes, they calculate separately!**
        - **Individual Shipment Orders:** In this POS system, each sale / shipment transaction is logged as an independent order with its own distinct `transport_cost` (courier / delivery fee in **৳ BDT**).
        - **Multiple Shipments of Same Item:** If a customer orders 50 units of the same item to be dispatched in 2 batches (e.g., 20 units shipped to Dhaka today for ৳120 freight, and 30 units shipped to Chittagong next week for ৳250 freight), each transaction records its own separate invoice with its respective transport cost:
          $$\\text{Total}_1 = (20 \\times \\text{Price}) + \\text{৳}120$$
          $$\\text{Total}_2 = (30 \\times \\text{Price}) + \\text{৳}250$$
        - **No Cost Blending:** Freight fees are never mixed or lost; every shipment maintains its own line-item audit trail and printed invoice.
        """)

    df_inv = fetch_inventory_df()

    if df_inv.empty:
        st.warning("Inventory is currently empty. Please add items in 'Inventory Management' first.")
    else:
        col_form, col_history = st.columns([1, 1], gap="large")

        with col_form:
            st.subheader("New Customer Order")
            item_map = {f"{row['item_name']} (৳{row['price']:,.2f} BDT, {row['stock_level']} in stock)": row for _, row in df_inv.iterrows()}
            selected_label = st.selectbox("Select Product to Sell", options=list(item_map.keys()))
            selected_row = item_map[selected_label]

            current_stock = int(selected_row["stock_level"])
            unit_price = float(selected_row["price"])
            item_id = int(selected_row["id"])
            item_name = str(selected_row["item_name"])

            # PREVIOUS CUSTOMER AUTO-FILL & SUGGESTION LOGIC
            previous_customers = fetch_previous_customers()
            cust_options = ["-- New Customer / Walk-in --"] + [f"{c['phone']} — {c['name']} ({c['address']})" for c in previous_customers]

            selected_cust_opt = st.selectbox("🔍 Quick Select Previous Customer (Auto-Fills Details):", options=cust_options)

            # Auto-fill defaults
            default_name = ""
            default_phone = ""
            default_address = ""

            if selected_cust_opt != "-- New Customer / Walk-in --":
                chosen_phone = selected_cust_opt.split(" — ")[0].strip()
                match_cust = next((c for c in previous_customers if c["phone"] == chosen_phone), None)
                if match_cust:
                    default_name = match_cust["name"]
                    default_phone = match_cust["phone"]
                    default_address = match_cust["address"]

            with st.form("pos_sale_form", clear_on_submit=False):
                st.markdown("#### 👤 Customer Billing & Shipping Information")
                c_phone = st.text_input("Customer Phone Number", value=default_phone, placeholder="e.g. 01712-345678")
                c_name = st.text_input("Customer / Business Name", value=default_name, placeholder="e.g. Tanvir Ahmed")
                c_addr = st.text_input("Delivery / Shipping Address", value=default_address, placeholder="e.g. House 42, Road 11, Banani, Dhaka")

                st.markdown("#### 📦 Order Quantities & Financial Calculation")
                qty = st.number_input("Quantity Sold", min_value=1, max_value=max(1, current_stock), value=1, step=1)
                
                col_calc1, col_calc2 = st.columns(2)
                with col_calc1:
                    shipment_cost = st.number_input(
                        "Shipment / Transport Fee (৳ BDT)", 
                        min_value=0.0, 
                        value=120.0, 
                        step=10.0, 
                        format="%.2f",
                        help="Calculated separately per delivery batch (e.g. Steadfast / Pathao / RedX)"
                    )
                with col_calc2:
                    discount = st.number_input(
                        "Discount / Promo (৳ BDT)", 
                        min_value=0.0, 
                        value=0.0, 
                        step=10.0, 
                        format="%.2f"
                    )

                subtotal = qty * unit_price
                grand_total = max(0.0, subtotal + shipment_cost - discount)

                st.markdown(f"""
                <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin: 12px 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569;">
                        <span>Item Subtotal ({qty}x @ ৳{unit_price:,.2f}):</span>
                        <span style="font-family: monospace; font-weight: bold;">৳{subtotal:,.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #0284c7; margin-top: 4px;">
                        <span>+ Shipment Transport Fee (Separate):</span>
                        <span style="font-family: monospace; font-weight: bold;">+ ৳{shipment_cost:,.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 15px; color: #0f172a; margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-weight: 800;">
                        <span>Grand Total Payable:</span>
                        <span style="color: #059669; font-family: monospace;">৳{grand_total:,.2f} BDT</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                submit_sale = st.form_submit_button("💳 Complete Sale & Print Invoice", use_container_width=True, type="primary")
                
                if submit_sale:
                    if process_sale(item_id, qty, current_stock, item_name, unit_price, shipment_cost, discount, c_name, c_addr, c_phone):
                        st.success(f"Sale processed! Stock updated. Total: ৳{grand_total:,.2f} BDT.")
                        st.rerun()

            # Render Printable Invoice
            if st.session_state.last_invoice:
                st.divider()
                st.markdown("### 🖨️ Printable Invoice Preview")
                render_printable_invoice(st.session_state.last_invoice)

        with col_history:
            st.subheader("Sales Ledger & Customer Search")
            sales_df = fetch_sales_history_df()
            if not sales_df.empty:
                s_search = st.text_input("🔍 Search sales by receipt #, customer phone, name, or product", "")
                if s_search:
                    sales_df = sales_df[
                        sales_df["Receipt #"].str.contains(s_search, case=False, na=False) |
                        sales_df["Item"].str.contains(s_search, case=False, na=False) |
                        sales_df["Customer Name"].str.contains(s_search, case=False, na=False) |
                        sales_df["Customer Phone"].str.contains(s_search, case=False, na=False) |
                        sales_df["Customer Address"].str.contains(s_search, case=False, na=False)
                    ]
                st.dataframe(sales_df, use_container_width=True, hide_index=True)

                st.markdown("#### 📥 Export Sales Ledger")
                s_c1, s_c2, s_c3 = st.columns(3)
                with s_c1:
                    st.download_button(
                        label="📄 Export to Excel (.xlsx)",
                        data=export_df_to_excel(sales_df, sheet_name="Sales_Log"),
                        file_name=f"sales_ledger_{datetime.now().strftime('%Y%m%d')}.xlsx",
                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        use_container_width=True
                    )
                with s_c2:
                    st.download_button(
                        label="📑 Export to PDF (.pdf)",
                        data=export_df_to_pdf(sales_df, "Sales Ledger & Customer Transactions", "Currency: Bangladeshi Taka (৳ BDT)"),
                        file_name=f"sales_ledger_{datetime.now().strftime('%Y%m%d')}.pdf",
                        mime="application/pdf",
                        use_container_width=True
                    )
                with s_c3:
                    st.download_button(
                        label="📝 Export to Word (.doc)",
                        data=export_df_to_doc(sales_df, "Sales Ledger with Customer Details (BDT)"),
                        file_name=f"sales_ledger_{datetime.now().strftime('%Y%m%d')}.doc",
                        mime="application/msword",
                        use_container_width=True
                    )
            else:
                st.caption("No sales recorded yet.")

# ==============================================================================
# 12. VIEW: INVENTORY MANAGEMENT (SHIPMENT CODE, EQUAL DISPERSION & 5% PROFIT TAB)
# ==============================================================================
elif page == "Inventory Management":
    st.title("📦 Inventory Management & Shipment Logistics")
    st.caption("Receive shipments, disperse transport and handling costs equally into buying price, apply 5% profit suggestion, or insert selling price manually. Currency: ৳ BDT.")

    tab_shipment, tab_single, tab_catalog, tab_update, tab_mig = st.tabs([
        "🚚 Receive Multi-Item Shipment", 
        "➕ Quick Add Single Product", 
        "📊 Landed Cost Catalog",
        "🔄 Update Stock & Price", 
        "📥 Legacy Data Migration"
    ])

    # --------------------------------------------------------------------------
    # TAB 1: MULTI-ITEM SHIPMENT INTAKE (EQUAL TRANSPORT & HANDLING DISPERSION)
    # --------------------------------------------------------------------------
    with tab_shipment:
        st.subheader("🚚 Multi-Item Shipment Receiving & Equal Cost Dispersion")
        st.info("💡 **Equal Dispersion Rule:** In one shipment there can be multiple items. The total transport cost (and other handling cost) is **equally dispersed** into each item's landed buying cost.")

        col_s1, col_s2, col_s3 = st.columns(3)
        with col_s1:
            shp_code = st.text_input("Shipment Code / Batch ID", value=f"SHP-{datetime.now().strftime('%Y')}-05", help="Unique identifier for this shipment batch")
        with col_s2:
            shp_transport = st.number_input("Total Transport Cost for Shipment (৳ BDT)", min_value=0.0, value=1200.0, step=50.0, format="%.2f")
        with col_s3:
            shp_handling = st.number_input("Other Handling Cost (৳ BDT)", min_value=0.0, value=300.0, step=25.0, format="%.2f")

        num_items = st.slider("Number of distinct items in this shipment", min_value=1, max_value=5, value=3, step=1)

        # Equal dispersion calculations
        disp_transport = round(shp_transport / num_items, 2)
        disp_handling = round(shp_handling / num_items, 2)
        disp_total = round(disp_transport + disp_handling, 2)

        st.success(f"⚖️ **Equal Dispersion Formula:** Total Transport ৳{shp_transport:,.2f} + Handling ৳{shp_handling:,.2f} ÷ {num_items} items = **+৳{disp_transport:,.2f} Transport** and **+৳{disp_handling:,.2f} Handling** (+৳{disp_total:,.2f} total overhead) added into each item's buying cost.")

        with st.form("multi_item_shipment_form"):
            item_data_collected = []
            for idx in range(num_items):
                st.markdown(f"##### 📦 Item #{idx + 1}")
                col_i1, col_i2, col_i3, col_i4, col_i5 = st.columns([2.5, 1.2, 1.5, 1.5, 1.8])

                with col_i1:
                    i_name = st.text_input(f"Item Name #{idx+1}", value=f"Product {idx+1}", key=f"shp_item_name_{idx}")
                with col_i2:
                    i_qty = st.number_input(f"Quantity #{idx+1}", min_value=1, value=20, step=1, key=f"shp_item_qty_{idx}")
                with col_i3:
                    i_buy = st.number_input(f"Buying Price (৳) #{idx+1}", min_value=0.0, value=1500.0 + (idx * 500.0), step=50.0, format="%.2f", key=f"shp_item_buy_{idx}")

                # Calculate landed buying cost
                landed_cost = round(i_buy + disp_total, 2)
                suggested_5pct = round(landed_cost * 1.05, 2)

                with col_i4:
                    st.metric(label=f"Landed Buying Cost", value=f"৳{landed_cost:,.2f}", delta=f"+৳{disp_total:,.0f} overhead")

                with col_i5:
                    # Suggestion tab / checkbox for 5% profit or manual insertion
                    use_5pct = st.checkbox("Apply 5% Profit Suggestion", value=True, key=f"shp_item_use_5pct_{idx}")
                    default_selling = suggested_5pct if use_5pct else round(landed_cost * 1.10, 2)
                    i_sell = st.number_input(f"Selling Price (৳) #{idx+1}", min_value=0.0, value=default_selling, step=25.0, format="%.2f", key=f"shp_item_sell_{idx}", help="Can be set via 5% suggestion tab or entered manually")

                item_data_collected.append({
                    "name": i_name,
                    "qty": i_qty,
                    "buy_price": i_buy,
                    "landed_cost": landed_cost,
                    "suggested_price": suggested_5pct,
                    "sell_price": i_sell
                })
                st.divider()

            submit_shipment = st.form_submit_button("🚀 Commit Entire Shipment to Inventory", type="primary", use_container_width=True)

            if submit_shipment:
                any_empty = any(not it["name"].strip() for it in item_data_collected)
                if any_empty:
                    st.error("Please provide valid product names for all items in the shipment.")
                else:
                    success_count = 0
                    timestamp_now = datetime.utcnow().isoformat()
                    for it in item_data_collected:
                        try:
                            supabase.table("inventory").insert({
                                "item_name": it["name"].strip(),
                                "stock_level": int(it["qty"]),
                                "price": float(it["sell_price"]),
                                "shipment_code": shp_code.strip(),
                                "buying_price": float(it["buy_price"]),
                                "transport_cost": float(shp_transport),
                                "handling_cost": float(shp_handling),
                                "dispersed_transport": float(disp_transport),
                                "total_buying_cost": float(it["landed_cost"]),
                                "suggested_price": float(it["suggested_price"]),
                                "updated_by": st.session_state.user_email,
                                "last_updated": timestamp_now
                            }).execute()
                            success_count += 1
                        except Exception as e:
                            # Fallback without extra columns if table hasn't added new columns
                            try:
                                supabase.table("inventory").insert({
                                    "item_name": it["name"].strip(),
                                    "stock_level": int(it["qty"]),
                                    "price": float(it["sell_price"]),
                                    "updated_by": st.session_state.user_email,
                                    "last_updated": timestamp_now
                                }).execute()
                                success_count += 1
                            except Exception:
                                pass
                    st.success(f"✅ Shipment '{shp_code}' processed! Added {success_count} items to inventory. Transport cost (৳{shp_transport:,.2f}) equally dispersed at ৳{disp_transport:,.2f}/item.")
                    st.rerun()

    # --------------------------------------------------------------------------
    # TAB 2: QUICK ADD SINGLE PRODUCT
    # --------------------------------------------------------------------------
    with tab_single:
        st.subheader("Add Single Product with Shipment & 5% Profit Suggestion")
        with st.form("add_single_item_form", clear_on_submit=True):
            new_item_name = st.text_input("Product Title / Item Name", placeholder="e.g. Premium Arabica Coffee Beans (1kg)")
            c_s1, c_s2, c_s3 = st.columns(3)
            with c_s1:
                single_shp = st.text_input("Shipment Code", value=f"SHP-{datetime.now().strftime('%Y')}-09")
            with c_s2:
                single_transport = st.number_input("Shipment Transport Cost (৳ BDT)", min_value=0.0, value=600.0, step=50.0)
            with c_s3:
                single_items_count = st.number_input("Items Sharing This Shipment", min_value=1, value=2, step=1, help="Equally disperses transport across this number of items")

            disp_t_single = round(single_transport / max(1, single_items_count), 2)

            c_b1, c_b2, c_b3 = st.columns(3)
            with c_b1:
                new_stock = st.number_input("Initial Stock Level (Units)", min_value=0, value=25, step=1)
            with c_b2:
                new_buy_price = st.number_input("Buying Price (৳ BDT)", min_value=0.0, value=2000.0, step=50.0)
            
            single_landed = round(new_buy_price + disp_t_single, 2)
            single_sugg_5pct = round(single_landed * 1.05, 2)

            with c_b3:
                st.markdown(f"**Landed Cost:** ৳{single_landed:,.2f}")
                st.caption(f"Buying ৳{new_buy_price} + Dispersed Transport ৳{disp_t_single}")

            st.markdown(f"✨ **Suggestion Tab:** 5% Profit Price = **৳{single_sugg_5pct:,.2f} BDT**")
            new_price = st.number_input(
                "Selling Price (৳ BDT) — Can be inserted manually or based on 5% suggestion tab", 
                min_value=0.0, 
                value=single_sugg_5pct, 
                step=50.0, 
                format="%.2f"
            )

            submit_add = st.form_submit_button("Save Item to Catalog", use_container_width=True, type="primary")
            if submit_add:
                if not new_item_name.strip():
                    st.error("Item name cannot be empty.")
                else:
                    try:
                        supabase.table("inventory").insert({
                            "item_name": new_item_name.strip(),
                            "stock_level": int(new_stock),
                            "price": float(new_price),
                            "shipment_code": single_shp.strip(),
                            "buying_price": float(new_buy_price),
                            "transport_cost": float(single_transport),
                            "dispersed_transport": float(disp_t_single),
                            "total_buying_cost": float(single_landed),
                            "suggested_price": float(single_sugg_5pct),
                            "updated_by": st.session_state.user_email,
                            "last_updated": datetime.utcnow().isoformat()
                        }).execute()
                    except Exception:
                        supabase.table("inventory").insert({
                            "item_name": new_item_name.strip(),
                            "stock_level": int(new_stock),
                            "price": float(new_price),
                            "updated_by": st.session_state.user_email,
                            "last_updated": datetime.utcnow().isoformat()
                        }).execute()
                    st.success(f"Product '{new_item_name}' added to inventory at ৳{new_price:,.2f} BDT (Landed Cost: ৳{single_landed:,.2f})!")
                    st.rerun()

    # --------------------------------------------------------------------------
    # TAB 3: LANDED COST & SHIPMENT CATALOG TABLE
    # --------------------------------------------------------------------------
    with tab_catalog:
        st.subheader("📊 Inventory Catalog with Landed Buying Cost Breakdown")
        df_inv = fetch_inventory_df()
        if not df_inv.empty:
            cat_search = st.text_input("🔍 Search catalog by product name or shipment code", "")
            if cat_search:
                df_inv = df_inv[
                    df_inv["item_name"].str.contains(cat_search, case=False, na=False) |
                    df_inv["shipment_code"].str.contains(cat_search, case=False, na=False)
                ]
            st.dataframe(df_inv, use_container_width=True, hide_index=True)
        else:
            st.info("No items in inventory.")

    # --------------------------------------------------------------------------
    # TAB 4: UPDATE STOCK & PRICE
    # --------------------------------------------------------------------------
    with tab_update:
        st.subheader("Update Existing Product Stock & Price")
        df_inv = fetch_inventory_df()
        if not df_inv.empty:
            item_names = df_inv["item_name"].tolist()
            selected_update_name = st.selectbox("Select Product to Update", options=item_names)
            current_row = df_inv[df_inv["item_name"] == selected_update_name].iloc[0]

            with st.form("update_stock_form"):
                u_c1, u_c2 = st.columns(2)
                with u_c1:
                    new_level = st.number_input("Stock Quantity", min_value=0, value=int(current_row['stock_level']), step=1)
                with u_c2:
                    new_pr = st.number_input("Selling Price (৳ BDT)", min_value=0.0, value=float(current_row['price']), step=50.0, format="%.2f")

                if st.form_submit_button("Update Inventory Record", use_container_width=True, type="primary"):
                    supabase.table("inventory").update({
                        "stock_level": int(new_level),
                        "price": float(new_pr),
                        "updated_by": st.session_state.user_email,
                        "last_updated": datetime.utcnow().isoformat()
                    }).eq("id", int(current_row["id"])).execute()
                    st.success(f"Updated '{selected_update_name}' to {new_level} units at ৳{new_pr:,.2f} BDT!")
                    st.rerun()
        else:
            st.info("No items available to update.")

    # --------------------------------------------------------------------------
    # TAB 5: LEGACY EXCEL MIGRATION
    # --------------------------------------------------------------------------
    with tab_mig:
        st.subheader("Legacy Excel Data Migration")
        st.markdown("Automated bulk ingestion from `Inventory_Tracker.xlsx` directly into Supabase using Pandas.")
        if os.path.exists("Inventory_Tracker.xlsx"):
            st.success("✅ Detected 'Inventory_Tracker.xlsx' in workspace root!")
            st.dataframe(pd.read_excel("Inventory_Tracker.xlsx").head(), use_container_width=True)
            if st.button("🚀 Run Bulk Migration Now", type="primary"):
                try:
                    count = migrate_legacy_excel("Inventory_Tracker.xlsx")
                    st.success(f"Successfully migrated {count} items into Supabase inventory!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Migration error: {e}")
        else:
            st.warning("⚠️ 'Inventory_Tracker.xlsx' not found in workspace.")

# ==============================================================================
# 13. VIEW: ADMIN PANEL (USER CREATION)
# ==============================================================================
elif page == "Admin Panel":
    st.title("🛡️ Administrator Control Center")
    st.caption("Provision users bypassing confirmation emails via Supabase Service Role Key")

    with st.form("admin_create_user_form", clear_on_submit=True):
        user_email_input = st.text_input("New Member Email", placeholder="cashier@company.com")
        user_pwd_input = st.text_input("Assign Temporary Password", type="password", placeholder="Min 6 characters")
        user_role_input = st.selectbox("Assign Permission Role", ["Cashier", "Inventory Manager", "Administrator"])
        submit_create = st.form_submit_button("✨ Provision User Account", use_container_width=True, type="primary")

        if submit_create:
            if user_email_input and len(user_pwd_input) >= 6:
                try:
                    supabase_admin.auth.admin.create_user({
                        "email": user_email_input.strip(),
                        "password": user_pwd_input,
                        "email_confirm": True,
                        "user_metadata": {"role": user_role_input, "created_by": st.session_state.user_email}
                    })
                    st.success(f"User '{user_email_input}' provisioned instantly without email verification!")
                except Exception as e:
                    st.error(f"Failed to provision user: {e}")
            else:
                st.warning("Please provide a valid email and a password with at least 6 characters.")

# ==============================================================================
# 14. VIEW: DOWNLOAD app.py & DEPLOYMENT INSTRUCTIONS
# ==============================================================================
elif page == "Download app.py":
    st.title("📄 Direct Download: app.py")
    st.caption("Grab the exact, full Python file to run locally or deploy to share.streamlit.io")

    # Read current app.py
    current_app_py_content = ""
    if os.path.exists("app.py"):
        with open("app.py", "r", encoding="utf-8") as f:
            current_app_py_content = f.read()

    st.markdown("""
    ### 📍 File Location
    Your complete Streamlit application code is saved right at the root of your project:
    ```bash
    /app.py
    ```
    """)

    st.download_button(
        label="📥 Download app.py (Single File)",
        data=current_app_py_content.encode("utf-8") if current_app_py_content else b"",
        file_name="app.py",
        mime="text/x-python",
        type="primary",
        use_container_width=True
    )

    st.markdown("### 📋 Quick Deploy to Streamlit Cloud (share.streamlit.io)")
    st.markdown("""
    1. **Push to GitHub**:
       ```bash
       git init
       git add app.py requirements.txt .gitignore
       git commit -m "Initial commit of inventory & POS system"
       git branch -M main
       git remote add origin https://github.com/your-username/inventory_app.git
       git push -u origin main
       ```
    2. **Connect on Streamlit Community Cloud**:
       - Go to [share.streamlit.io](https://share.streamlit.io).
       - Select your repository and set Main file path: `app.py`.
    3. **Configure Secrets** (`App Settings -> Secrets`):
       ```toml
       SUPABASE_URL = "https://your-project.supabase.co"
       SUPABASE_KEY = "your-anon-public-key"
       SUPABASE_SERVICE_KEY = "your-service-role-secret-key"
       ```
    """)
