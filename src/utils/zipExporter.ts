import JSZip from 'jszip';
import {
  COMPLETE_PYTHON_APP_CODE,
  SUPABASE_SQL_SCHEMA,
  SECRETS_TOML_TEMPLATE,
  GITIGNORE_CONTENT,
  REQUIREMENTS_TXT_CONTENT,
} from './codeTemplates';
import { createExcelBuffer } from './excelGenerator';
import { LEGACY_EXCEL_TEMPLATE_DATA } from '../data/initialData';

export async function exportProjectZip(): Promise<void> {
  const zip = new JSZip();

  // 1. app.py
  zip.file('app.py', COMPLETE_PYTHON_APP_CODE);

  // 2. requirements.txt
  zip.file('requirements.txt', REQUIREMENTS_TXT_CONTENT);

  // 3. supabase_schema.sql
  zip.file('supabase_schema.sql', SUPABASE_SQL_SCHEMA);

  // 4. .gitignore
  zip.file('.gitignore', GITIGNORE_CONTENT);

  // 5. .streamlit/secrets.toml.example
  const streamlitFolder = zip.folder('.streamlit');
  streamlitFolder?.file('secrets.toml.example', SECRETS_TOML_TEMPLATE);

  // 6. Inventory_Tracker.xlsx
  const excelBuffer = createExcelBuffer(LEGACY_EXCEL_TEMPLATE_DATA);
  zip.file('Inventory_Tracker.xlsx', excelBuffer);

  // 7. README.md
  const readmeContent = `# Cloud Inventory & Sales Management (Streamlit + Supabase + Pandas)

An enterprise-ready, internet-synced multi-user inventory and POS system with strict authentication, admin provisioning, cashier audit trails, Excel legacy migration, advanced search, and instant multi-format exports (.xlsx, .pdf, .docx).

## Features
- 🔐 **Strict Supabase Auth**: Session gate prevents any data leakage before sign-in.
- 🛡️ **Admin Panel**: Provision team members bypassing email confirmation with Supabase Service Role Key.
- 🛒 **Point of Sale (POS)**: Real-time stock deduction, transaction receipts, and cashier audit logs.
- 🔍 **Advanced Search**: Filter items by name, SKU, cashier, stock level (Low/In/Out), and price range.
- 📥 **Document Exports**: One-click export of inventory & sales to Microsoft Excel (.xlsx), PDF reports (.pdf), and Word documents (.docx).
- 📥 **Legacy Migration**: \`migrate_excel_data()\` function parses \`Inventory_Tracker.xlsx\` using Pandas.

## Quickstart

1. **Setup Environment**
\`\`\`bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`

2. **Database Setup**
- Run the SQL statements from \`supabase_schema.sql\` in your Supabase SQL Editor.
- Copy \`.streamlit/secrets.toml.example\` to \`.streamlit/secrets.toml\` and fill your \`SUPABASE_URL\`, \`SUPABASE_KEY\`, and \`SUPABASE_SERVICE_KEY\`.

3. **Run Locally**
\`\`\`bash
streamlit run app.py
\`\`\`

4. **Deploying to streamlit.app (Streamlit Community Cloud)**
1. Initialize git and commit:
   \`\`\`bash
   git init
   git add .
   git commit -m "Deploy inventory suite"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USER>/<YOUR_REPO>.git
   git push -u origin main
   \`\`\`
2. Sign in to [share.streamlit.io](https://share.streamlit.io).
3. Click **"New app"**, select your GitHub repository and set file to \`app.py\`.
4. Click **"Advanced settings..."** -> **"Secrets"**, paste your \`.streamlit/secrets.toml\` content.
5. Click **"Deploy"**! Your app is now live with an official \`*.streamlit.app\` URL.
`;
  zip.file('README.md', readmeContent);

  // Generate and download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'streamlit-supabase-inventory-suite.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
