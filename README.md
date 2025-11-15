# 🚀 On Cloud Payroll - Phase 2

## Advanced Expense & Payment Management System

**Version:** 2.1.0  
**Release Date:** November 2024  
**Status:** Phase 2.1 - Foundation Complete

---

## ✨ NEW FEATURES IN PHASE 2.1

### 🔐 Multi-User Login System
- Secure login with username/password
- Role-based access (Admin, Supervisor, Accountant, User)
- User profile management
- Session management

### 📊 Master Data Management
- **Employee Database** - Auto-imported from payroll
- **Vendor Database** - Pre-loaded with 13 vendors
- Search and filter capabilities
- Auto-update bank details

### 💰 Smart Expense Management
- Submit expenses with full accounting details
- Select payee from master data (auto-fills bank details)
- Expense for yourself or on behalf of others
- Duplicate detection and warnings
- Amount validation with ranges

### ⚠️ Intelligent Validations
- **Rent:** ₹100,000 - ₹150,000
- **Interest:** ₹10,000 - ₹90,000
- **Petrol:** ₹1 - ₹3,000
- **Other:** Alert if > ₹5,000
- Custom ranges for all expense types

### 📋 Expense Queue & Approval
- Pending expenses list
- Approve/reject functionality (Admin only)
- Track who submitted and who approved
- Warning flags for unusual amounts or duplicates

### 🎯 Double-Entry Accounting
- Proper Dr/Cr account assignment
- **Dr Account:** Expense type (Petrol A/c, Rent A/c, etc.)
- **Cr Account:** Employee who uploaded/paid
- TDS calculation where applicable

---

## 🏗️ PRE-LOADED DATA

### Default Login Credentials:
- **Username:** admin
- **Password:** admin123
- **Role:** Admin (full access)

### Pre-loaded Vendors (13):
1. ALPINE
2. AMMAN TRADERS (3 branches)
3. VARSHA COTTON MILLS
4. ARISTOCRATIC ENTERPRISES
5. ASM TEXTILES
6. BABBALTEXO FAB
7. BHAIRAAV WATER SYSTEMS
8. CHIRAG ENTERPRISE
9. COSMIC COMPUTER
10. DIGIWHITE FABRICS LLP
11. EAGLE PRINT CARE
12. FRIENDS PACK
13. GINNI SPECTRA

---

## 📋 EXPENSE TYPES & VALIDATION RULES

| Expense Type | Dr Account | TDS | Min Amount | Max Amount | Alert Threshold |
|--------------|------------|-----|------------|------------|-----------------|
| Rent | Factory Rent A/c @GST | 10% | ₹100,000 | ₹150,000 | - |
| Interest | Loan Interest A/c | 10% | ₹10,000 | ₹90,000 | - |
| Petrol | Petrol A/c | - | ₹1 | ₹3,000 | - |
| Advance | Staff Advance A/c | - | ₹500 | ₹50,000 | - |
| Loan | Staff Loan A/c | - | ₹1,000 | ₹100,000 | - |
| Cutting Charges | Cutting Charges A/c | 1% | ₹1,000 | ₹100,000 | - |
| Stitching Charges | Stitching Charges A/c | 1% | ₹1,000 | ₹100,000 | - |
| Professional Fees | Professional Fees A/c | 10% | ₹5,000 | ₹200,000 | - |
| Other | Miscellaneous Expenses A/c | - | ₹0 | ₹5,000 | > ₹5,000 |

---

## 🚀 DEPLOYMENT

### Option 1: Netlify Drop (Easiest)
1. Extract the ZIP file
2. Go to https://app.netlify.com/drop
3. Drag the `oncloud-payroll-phase2` folder
4. Wait 2 minutes
5. Done!

### Option 2: Vercel (via GitHub)
1. Upload to GitHub repository
2. Connect Vercel
3. Deploy
4. Done!

---

## 📖 HOW TO USE

### First Time Setup:
1. **Login** with admin/admin123
2. **Import Employees** - Go to Payroll tab, upload monthly CSV
3. **Verify Vendors** - Check Master Data tab
4. **Ready to use!**

### Daily Workflow:
1. **Login** to the system
2. **Go to Expenses tab**
3. **Fill expense details:**
   - Date
   - Type (Petrol, Rent, etc.)
   - Pay to (Vendor/Employee/Other)
   - Amount
   - Receipt number
   - Reason
   - For yourself or someone else
4. **System auto-fills** bank details from master data
5. **System validates** amount and checks duplicates
6. **Click "Add to Expense Queue"**
7. **Admin approves** expenses
8. **Approved expenses** ready for payment batch

### Import Employees from Payroll:
1. Go to **Payroll** tab
2. Click **Upload Monthly Payroll CSV**
3. Select your PetPooja monthly export
4. System automatically:
   - Imports new employees
   - Updates existing employee bank details
   - Shows import count

---

## 💾 DATA STORAGE

**Current:** Browser LocalStorage (all data saved locally)  
**Backup:** Manual export (coming in Phase 2.2)  
**Security:** Data never leaves your browser

**Note:** Clear browser data = lose all expenses. Export feature coming soon!

---

## 🔐 USER ROLES

### Admin (You - Rajesh)
- ✅ Add/approve/reject expenses
- ✅ Manage master data
- ✅ Import payroll
- ✅ Generate payment files
- ✅ Full system access

### Supervisor (Coming Soon)
- ✅ Add expenses
- ✅ Approve department expenses
- ❌ Cannot approve own expenses

### Accountant (Coming Soon)
- ✅ View all data
- ✅ Export reports
- ❌ Cannot approve expenses

### User (Coming Soon)
- ✅ Submit own expenses
- ❌ Limited access

---

## 🚧 COMING IN PHASE 2.2 (Next Update)

- 📸 **AI Receipt Reading** - Upload PDF/JPEG, AI extracts data
- 📊 **Bulk Excel Upload** - Import multiple expenses at once
- 📤 **Export Features** - Backup master data and expenses
- 📈 **Reports** - Expense analytics and summaries
- 🔄 **Sync with Phase 1** - Use both systems together

---

## 🚧 COMING IN PHASE 2.3 (Final Phase)

- 👥 **User Management** - Add/edit/delete users
- 🔔 **Notifications** - Expense approval alerts
- 📊 **Advanced Reports** - Custom date ranges, filters
- 🤖 **AI Insights** - Spending patterns, anomalies
- ☁️ **Cloud Backup** (Optional) - Never lose data

---

## 📞 SUPPORT

**Email:** rajesh@oncloudindia.com  
**System:** On Cloud Payroll Phase 2  
**Version:** 2.1.0

---

## 🔄 UPGRADING FROM PHASE 1

Phase 2 is a **SEPARATE APPLICATION**. You can:
- Use both in parallel
- Phase 1 for payroll processing
- Phase 2 for expense management
- Eventually merge everything

**Migration:** Coming in Phase 2.3

---

## ⚠️ IMPORTANT NOTES

1. **First Login:** Use admin/admin123
2. **Change Password:** Feature coming in Phase 2.2
3. **Data Backup:** Export feature coming soon
4. **Browser Data:** Don't clear browser cache/cookies
5. **Multi-Device:** Each device has separate data (cloud sync coming)

---

## 🎯 QUICK START CHECKLIST

- [ ] Deploy to Netlify/Vercel
- [ ] Login with admin/admin123
- [ ] Import employees from monthly payroll
- [ ] Verify vendors in master data
- [ ] Add test expense
- [ ] Approve test expense
- [ ] Verify accounting entries look correct
- [ ] Start using for real expenses!

---

**Ready to revolutionize your expense management?** 🚀

**Questions? rajesh@oncloudindia.com**
