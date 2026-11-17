import pymongo
from bson import ObjectId
from datetime import datetime
import re

MONGO_URI = 'mongodb://127.0.0.1:27017/'
DB_NAME = 'chawnah_accountability'

client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]

print("=== STARTING IMPORT OF EMPLOYEE ASSETS MASTERLIST ===")

# 1. Ensure Brand / Company mapping rules
COMPANY_BRAND_MAP = {
    'Taters': {'brand': 'Taters', 'company': 'Pop and Chips Specialist Inc.', 'legalOwner': 'Pop and Chips Specialist Inc.'},
    'Icebergs/Savore': {'brand': 'Icebergs', 'company': 'Cool Ice Food Desserts', 'legalOwner': 'Cool Ice Food Desserts'},
    'Savore': {'brand': 'Savore', 'company': 'Savore Kitchen Corp', 'legalOwner': 'Savore Kitchen Corp'},
    'Chatime': {'brand': 'Chatime', 'company': 'Salu-salong Saya Food Inc.', 'legalOwner': 'Salu-salong Saya Food Inc.'},
    'Goldilocks': {'brand': 'Goldilocks', 'company': 'Chawnah Foods Inc.', 'legalOwner': 'Chawnah Foods Inc.'},
    'DU99': {'brand': 'DU99', 'company': 'DU99 Commercial Corp.', 'legalOwner': 'DU99 Commercial Corp.'},
}

# 2. Check and insert missing employees
missing_emps_to_create = [
    {
        'employeeId': '11172026-01',
        'name': 'DEYA MAE',
        'firstName': 'DEYA',
        'middleName': '',
        'lastName': 'MAE',
        'brand': 'Icebergs',
        'company': 'Cool Ice Food Desserts',
        'legalOwnerCompany': 'Cool Ice Food Desserts',
        'jobTitle': 'CHITS Specialist',
        'department': 'CHITS',
        'status': 'Active'
    },
    {
        'employeeId': '11172026-02',
        'name': 'MAE BITO',
        'firstName': 'MAE',
        'middleName': '',
        'lastName': 'BITO',
        'brand': 'Chatime',
        'company': 'Salu-salong Saya Food Inc.',
        'legalOwnerCompany': 'Salu-salong Saya Food Inc.',
        'jobTitle': 'CHITS Specialist',
        'department': 'CHITS',
        'status': 'Active'
    },
    {
        'employeeId': '11172026-03',
        'name': 'MAT LOGISTICS',
        'firstName': 'MAT',
        'middleName': '',
        'lastName': 'LOGISTICS',
        'brand': 'Goldilocks',
        'company': 'Chawnah Foods Inc.',
        'legalOwnerCompany': 'Chawnah Foods Inc.',
        'jobTitle': 'Logistics Custodian',
        'department': 'Logistics',
        'status': 'Active'
    },
]

for me in missing_emps_to_create:
    existing = db.employees.find_one({'name': me['name']})
    if not existing:
        me['createdAt'] = datetime.now()
        me['updatedAt'] = datetime.now()
        ins = db.employees.insert_one(me)
        print(f"Created employee: {me['name']} ({me['employeeId']}) -> {ins.inserted_id}")
    else:
        print(f"Employee already exists: {me['name']}")

all_emps = list(db.employees.find())

# Helper to find employee by exact name or aliases
def find_emp(query_name, dept_hint=''):
    q = query_name.strip()
    if not q:
        return None
    for e in all_emps:
        if q.lower() == e['name'].lower():
            return e
            
    aliases = {
        'Rovelyn Bernal': 'ROVELYN N. BERNAL',
        'Deya Mae': 'DEYA MAE',
        'Mae Bito': 'MAE BITO',
        'Lucy Opalia': 'MA. LUCY L. OPALIA',
        'Justine Jacobe': 'JUSTINE C. JACOBE',
        'Ma. Analyn Obando': 'MA. ANALYN B. OBANDO',
        'Rosalie Ragobrio': 'ROSALIE M. RAGOBRIO',
        'Mia Vrenelie Esmero': 'MIA VRENELIE O. ESMERO',
        'Ruin Raizza Relador': 'RUIN RAIZZA F. RELADOR',
        'Queenly Lubiano': 'QUEENLY P. LUBIANO',
        'Edjelyn Tumandao': 'EDJELYN MAY G. TUMANDAO',
        'Ivy Vinegas': 'IVY R. VENIGAS',
        'Danyl Patriana': 'DANEL J. PATRIANA',
        'Jenny': 'JEAN B. BULGADO',  # Internal Auditor under Welmar in Audit
        'Welmar': 'WELMAR A. IGAY',
        'Dona Mae': 'DONA MAE G. OLEGARIO',
        'Christian Pongos': 'CHRISTIAN WIL D. PONGOS',
        'Luigi Andrey L. Opalia': 'LUIGI ANDREY L. OPALIA',
        'Luigi Andrey Opalia': 'LUIGI ANDREY L. OPALIA',
        'Queben Johnson Coquilla': 'QUEBEN JOHNSON D. COQUILLA',
        'Rosalyn G. Brasilenio': 'ROSALYN G. BRASILEÑO',
        'Leah Viloan': 'LEAH A. VILOAN',
        'Mat Logistics': 'MAT LOGISTICS',
        'Milka Aguillon': 'MILKA A. AGUILON',
        'Mark Delgado': 'MARK FELIX I. DELGADO',
        'Jovelyn Bescoro': 'JOVELYN M. BESCORO',
        'Necole': 'NICOLE H. VERZOSA',
        'Gilacio Bigute': 'GILACIO M. BIGUTE',
        'Mark Delute': 'MARK S. DELUTE',
        'ADMIN / Sir Mark Delute': 'MARK S. DELUTE',
        'Joshua Astanio': 'JOSHUA ASTANIO',
        'John Patrick Zambrano': 'JOHN PATRICK D. ZAMBRANO',
        'Justmer Rivera': 'JUSTMER D. RIVERA',
        'Ma Judy Ann Campaner': 'MA. JUDY ANN D. CAMPANER',
        'Ma. Judy Ann Campaner': 'MA. JUDY ANN D. CAMPANER',
        'Admin / Kristine Joy G. Nogal': 'KRISTINE JOY G. NOGAL',
        'Kristine Joy G. Nogal': 'KRISTINE JOY G. NOGAL',
        'Melejoy Dagami': 'MELEJOY E. DAGAMI',
        'Kate Mabag': 'KATE F. MABAG',
        'Sheila Sam': 'SHEILA G. SAMONG',
        'Kathreen Pineda': 'KATHREEN B. PINEDA',
        'Alondra Mae Dajoya': 'ALONDRA MAE P. DAJOYA',
        'Jenny Rose Lacay': 'JENNY ROSE B. LACAY',
        'Michelle Abuyen': 'MICHELLE S. ABUYEN',
        'Jannelle Canillas': 'JANNELLE T. CANILLAS',
        'Shina Mae Millano': 'SHINA MAE C. MILLANO',
        'Roxan Sabela': 'ROXAN A. SABELA',
        'Escarlet B. Trigueros': 'ESCARLET B. TRIGUEROS',
        'Aira Mae Jane Madjos': 'AIRA MAE JANE G. MADJOS',
        'Maricel A. Sabela': 'MARICEL A. SABELA',
        'Joname Gementiza': 'JONAME G. GEMENTIZA',
        'Marilou Poleno': 'MA MARILOU S. POLEÑO',
        'Ria Jane Portugal': 'RIA JANE V. PORTUGAL',
        'Jelyn Rosa': 'JELYN L. ROSA',
        'Mynche Otivar': 'MYNCHE D. OTIVAR',
        'Cathrina Gagam': 'CATHRINA O. GAGAM',
    }
    
    if q in aliases:
        tname = aliases[q]
        for e in all_emps:
            if e['name'] == tname:
                return e
                
    parts = [p.lower() for p in re.split(r'[\s\.\,]+', q) if len(p) > 1 and p.lower() not in ['ma', 'sir', 'admin', 'dept']]
    for e in all_emps:
        ename = e['name'].lower()
        if all(p in ename for p in parts):
            return e
    return None

# 3. Clean up non-store prototype accountability records and items (e.g. CFI-ACT-2026-0045)
print("\n=== CLEANING UP PREVIOUS NON-STORE PROTOTYPES ===")
del_acc = db.accountabilityrecords.delete_many({'accountabilityType': {'$ne': 'Store'}})
print(f"Deleted {del_acc.deleted_count} non-store accountability records.")

del_items = db.items.delete_many({'itemNumber': {'$not': {'$regex': '^ITM-S'}}})
print(f"Deleted {del_items.deleted_count} non-store items.")

# 4. Master data raw table
raw_table = """Company	Item Type	Set inclusions	Brand / Model	Assigned User	Department
Taters	Desktop Set	Keyboard, Mouse, UPS, Printer, Monitor, System Unit		Rovelyn Bernal	CHITS
Icebergs/Savore	Desktop Set	Keyboard, Mouse, UPS, Printer, Monitor, System Unit		Deya Mae	CHITS
Chatime	Desktop Set	Keyboard, Mouse, UPS, Printer, Monitor, System Unit		Mae Bito	CHITS
Icebergs/Savore	Desktop Set	Keyboard, Mouse, UPS, Printer, System Unit, Monitor		Lucy Opalia	CHITS
Goldilocks	Desktop Set	Keyboard, Mouse, UPS, Printer, System Unit, Monitor		Justine Jacobe	Admin
Goldilocks	Desktop Set	Keyboard, Mouse, Printer, UPS, Monitor, System Unit		Ma. Analyn Obando	Admin
Goldilocks	Desktop Set	Keyboard, Mouse, Monitor, System Unit, UPS, USB Splitter		Rosalie Ragobrio	Admin
Goldilocks	Desktop Set	Keyboard, Mouse, Monitor, System Unit, UPS		Mia Vrenelie Esmero	Admin
Goldilocks	Desktop Set	Keyboard, Mouse, System Unit, Monitor		Ruin Raizza Relador	Admin
Goldilocks	Laptop	Laptop, Mouse, Charger, Laptop Bag, Printer, Keyboard, USB Splitter		Queenly Lubiano	Admin
Goldilocks	Laptop	Laptop, Charger, Laptop Bag, Mouse, External Hard Drive, built-inLaptop Stand		Edjelyn Tumandao	Admin
Goldilocks	Laptop	Laptop, Charger, Laptop Bag		Ivy Vinegas	Admin
Goldilocks	Laptop	Laptop, Charger, Keyboard, Mouse, Laptop Stand, Laptop Bag		Danyl Patriana	Admin
Goldilocks	Laptop	Laptop, Charger, Laptop Bag		Jenny 	Audit
Goldilocks	Laptop	Laptop, Charger, Mouse		Welmar	Audit
		Laptop, Charger, Laptop Bag, UPS		Dona Mae	
Goldilocks	Desktop Set	Keyboard, Mouse, UPS, Printer, System Unit, Monitor, External Hard Drive		Christian Pongos	Admin
Goldilocks	Laptop	Charger, Laptop Bag	ASUS VIVOBOOK GO 14/15	Luigi Andrey L. Opalia	IT Department
Goldilocks		Laptop, Charger, Laptop Bag, USB C Docking Station	Mac Book	Queben Johnson Coquilla	Admin
Goldilocks		Laptop, Charger	ASUS VIVOBOOK GO 14/15	Rosalyn G. Brasilenio	Admin
Goldilocks		Mouse, Laptop, Laptop Bag, Charger	Acer	Leah Viloan	Human Resource
Goldilocks		Mouse, Laptop, Charger	Asus	Mat Logistics	Logistics
Goldilocks		Keyboard, Mouse, Monitor, System Unit, UPS		Milka Aguillon	Human Resource
DU99		Laptop, Charger	Acer Aspire Lite 14	Mark Delgado	Admin
DU99		Laptop, Charger	Acer Aspire Lite 14	Mark Delgado	Admin
DU99		Laptop, Charger, Laptop Bag, Printer, Company Phone	Acer Aspire Lite 14	Jovelyn Bescoro	Human Resource
DU99		Keyboard, Mouse, UPS, System Unit, Monitor		Necole	Human Resource
Goldilocks		Laptop, Charger, Powerpoint Pointer	Acer	Gilacio Bigute	Admin
Goldilocks		Mouse, Laptop, Printer, Charger, USB C Docking Station, Laptop Stand	Huawuei	Mark Delute	Admin
				Joshua Astanio	IT Department
				John Patrick Zambrano	IT Department
Goldilocks	Projector			IT DEPT	IT Department
Goldilocks	Printer			MARKETING DEPT	Marketing Department
Goldilocks	Printer			ADMIN / Sir Mark Delute	ADMIN
Icebergs/Savore	POS Set	POS Monitor, POS Printer		Justmer Rivera	IT Department
Icebergs/Savore	POS Set	POS Monitor, POS Printer		Luigi Andrey Opalia	IT Department
Goldilocks	Printer	Printer		Ma Judy Ann Campaner	Accounting
Goldilocks	Printer	Printer	Epson L3210	Admin / Kristine Joy G. Nogal	Accounting Department
Goldilocks	Printer	Printer	Epson L3210	Melejoy Dagami	Accounting
DU99	Printer	Printer	Epson L3210	Kate Mabag	Accounting
Goldilocks	Printer	Printer	Epson L3210	Sheila Sam	Accounting
Goldilocks	Dot Matrix	Printer	Epson 	Kathreen Pineda || Alondra Mae Dajoya	Accounting
Goldilocks	Dot Matrix	Printer	Epson 	Jenny Rose Lacay || Michelle Abuyen	Accounting
Goldilocks	Dot Matrix	Printer	Epson	Ma. Judy Ann Campaner	Accounting
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Jannelle Canillas	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit, UPS	Acer	Shina Mae Millano	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Roxan Sabela	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Escarlet B. Trigueros	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Aira Mae Jane Madjos	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Maricel A. Sabela	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Joname Gementiza	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Marilou Poleno	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Ria Jane Portugal	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Jelyn Rosa	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Mynche Otivar	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit, UPS	Acer	Jenny Rose Lacay	Inventory
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Michelle Abuyen	Inventory
DU99	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit, UPS	Acer	Kate Mabag	Accounting
DU99	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit, UPS	Acer	Sheila Sam	Accounting
DU99	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit, UPS	Asus	Melejoy Dagami	Accounting
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Kathreen Pineda	Accounting
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Alondra Mae Dajoya	Accounting
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Ma. Judy Ann Campaner	Accounting
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit	Acer	Kristine Joy G. Nogal	Accounting
Goldilocks	System Unit (CPU)	Keyboard, Mouse, Monitor, System Unit, UPS	Acer	Cathrina Gagam	Accounting"""

lines = [l for l in raw_table.split('\n') if l.strip()][1:]

def infer_specs(component_name, brand_model, row_itype):
    c = component_name.strip()
    c_lower = c.lower()
    bm = (brand_model or '').strip()
    
    # Category, equipmentType, default brandModel
    if 'laptop' in c_lower and 'bag' not in c_lower and 'stand' not in c_lower:
        cat = 'Laptops & Desktops'
        eq_type = 'Laptop'
        model = bm if bm else 'Office Business Laptop'
    elif 'system unit' in c_lower or 'cpu' in c_lower:
        cat = 'Laptops & Desktops'
        eq_type = 'Desktop Computer'
        model = f"{bm} Desktop System Unit" if bm else 'Intel Core i5 Desktop PC'
    elif 'monitor' in c_lower:
        cat = 'Printers & Peripherals'
        eq_type = 'POS Terminal' if 'pos' in c_lower else 'Monitor'
        model = f"{bm} LED Display Monitor" if bm and 'acer' in bm.lower() else '21.5" FHD LED Monitor'
    elif 'mouse' in c_lower:
        cat = 'Printers & Peripherals'
        eq_type = 'Mouse'
        model = 'Optical USB Mouse'
    elif 'keyboard' in c_lower:
        cat = 'Printers & Peripherals'
        eq_type = 'Keyboard'
        model = 'Standard USB Keyboard'
    elif 'ups' in c_lower:
        cat = 'Office Equipment'
        eq_type = 'UPS'
        model = '650VA / 360W Line-Interactive UPS'
    elif 'printer' in c_lower:
        cat = 'Printers & Peripherals'
        eq_type = 'POS Printer' if 'pos' in c_lower else 'Printer'
        if bm:
            model = bm
        elif 'dot matrix' in (row_itype or '').lower():
            model = 'Epson LQ Dot Matrix Printer'
        else:
            model = 'Multifunction Ink Tank Printer'
    elif 'projector' in c_lower:
        cat = 'Office Equipment'
        eq_type = 'Projector'
        model = 'FHD Multimedia Projector'
    elif 'charger' in c_lower:
        cat = 'Office Equipment'
        eq_type = 'Charger / Power Adapter'
        model = f"{bm} Power Adapter / Charger" if bm else 'AC Power Adapter'
    elif 'bag' in c_lower:
        cat = 'Office Equipment'
        eq_type = 'Laptop Bag'
        model = 'Protective Laptop Carrying Case'
    elif 'stand' in c_lower:
        cat = 'Office Equipment'
        eq_type = 'Laptop Stand'
        model = 'Ergonomic Aluminum Laptop Stand'
    elif 'external hard drive' in c_lower:
        cat = 'Office Equipment'
        eq_type = 'External Storage'
        model = '1TB External Portable Hard Drive'
    elif 'dock' in c_lower or 'splitter' in c_lower:
        cat = 'Office Equipment'
        eq_type = 'USB Hub / Docking Station'
        model = 'Multi-Port USB-C Hub / Dock'
    elif 'phone' in c_lower:
        cat = 'Mobile & Tablets'
        eq_type = 'Mobile Phone'
        model = 'Corporate Smartphone'
    elif 'pointer' in c_lower:
        cat = 'Office Equipment'
        eq_type = 'Presentation Clicker'
        model = 'Wireless Presentation Remote / Pointer'
    else:
        cat = 'Office Equipment'
        eq_type = 'Other'
        model = c
        
    return cat, eq_type, model

next_item_seq = 1
next_form_seq = 1

total_created_items = 0
total_created_forms = 0

for line_idx, line in enumerate(lines, 1):
    parts = [p.strip() for p in line.split('\t')]
    while len(parts) < 6:
        parts.append('')
    raw_comp, raw_itype, raw_incl, raw_brand, raw_user, raw_dept = parts[:6]
    
    if not raw_user and not raw_itype and not raw_incl:
        continue
    if not raw_incl and not raw_itype:
        print(f"Skipping line {line_idx} (no equipment listed for {raw_user})")
        continue

    # Resolve company / brand
    brand_info = COMPANY_BRAND_MAP.get(raw_comp)
    if not brand_info:
        for k, v in COMPANY_BRAND_MAP.items():
            if k.lower() in raw_comp.lower() or raw_comp.lower() in k.lower():
                brand_info = v
                break
    if not brand_info:
        brand_info = COMPANY_BRAND_MAP['Goldilocks']

    # Parse inclusion components
    component_names = []
    if raw_incl:
        component_names = [i.strip() for i in raw_incl.split(',') if i.strip()]
    elif raw_itype:
        component_names = [raw_itype.strip()]

    # If item type is Laptop and Laptop is not explicitly in inclusions, insert it as primary
    if raw_itype.strip().lower() == 'laptop' and not any(i.strip().lower() == 'laptop' for i in component_names):
        component_names.insert(0, 'Laptop')

    # Determine setTag & pre-set properties
    # Is this a multi-item package (Set)?
    is_set = False
    set_tag = None
    set_type_code = 'GEN'
    
    lower_itype = (raw_itype or '').lower()
    lower_incls = [i.lower() for i in component_names]
    
    if 'desktop set' in lower_itype or ('keyboard' in lower_incls and 'monitor' in lower_incls and 'system unit' in lower_incls):
        is_set = True
        set_tag = 'Desktop Set'
        set_type_code = 'DESK'
    elif 'laptop' in lower_itype or 'laptop' in lower_incls:
        if len(component_names) > 1:
            is_set = True
            set_tag = 'Laptop Set'
            set_type_code = 'LAP'
        else:
            is_set = False
            set_tag = None
    elif 'pos set' in lower_itype or ('pos monitor' in lower_incls and 'pos printer' in lower_incls):
        is_set = True
        set_tag = 'POS Set'
        set_type_code = 'POS'
    elif 'system unit' in lower_itype and len(component_names) > 1:
        is_set = True
        set_tag = 'Desktop Set'
        set_type_code = 'DESK'

    # Resolve custodian / employee
    is_dept_form = raw_user in ['IT DEPT', 'MARKETING DEPT']
    primary_emp = None
    sub_user_names = [u.strip() for u in raw_user.split('||')]
    
    if is_dept_form:
        acc_type = 'Department'
        dept_name = raw_dept or raw_user
        target_group = f"Department: {dept_name}"
        # Set IT manager or marketing as custodian contact
        emp_info = {
            'name': f"{raw_user} Custodian",
            'employeeId': 'CFI-DEPT',
            'jobTitle': 'Department In-Charge',
            'department': dept_name,
            'company': brand_info['company']
        }
        emp_id_str = f"D-{raw_user[:4].strip()}"
    else:
        acc_type = 'Individual'
        primary_emp = find_emp(sub_user_names[0], raw_dept)
        if primary_emp:
            emp_info = {
                'name': primary_emp['name'],
                'employeeId': primary_emp.get('employeeId', 'CFI-EMP'),
                'jobTitle': primary_emp.get('jobTitle', 'Staff'),
                'department': raw_dept or primary_emp.get('department', 'General'),
                'company': primary_emp.get('company', brand_info['company'])
            }
            emp_id_str = primary_emp.get('employeeId', '').replace('-', '')[-3:] or f"{next_form_seq:03d}"
            # Use employee's actual company & brand if present
            if primary_emp.get('brand'):
                brand_info = {
                    'brand': primary_emp['brand'],
                    'company': primary_emp.get('company', brand_info['company']),
                    'legalOwner': primary_emp.get('legalOwnerCompany', brand_info['legalOwner'])
                }
        else:
            emp_info = {
                'name': raw_user.upper(),
                'employeeId': f"EMP-{next_form_seq:03d}",
                'jobTitle': 'Staff',
                'department': raw_dept or 'General',
                'company': brand_info['company']
            }
            emp_id_str = f"{next_form_seq:03d}"
            
        target_group = f"Individual: {emp_info['name']}"
        if len(sub_user_names) > 1:
            target_group = f"Joint: {' & '.join([find_emp(u, raw_dept)['name'] if find_emp(u, raw_dept) else u for u in sub_user_names])}"

    # Form Number
    form_number = f"CFI-ACT-2026-{next_form_seq:04d}"

    # Pre-set tags if applicable (strictly unique per form sequence)
    set_equipment_tag = None
    set_item_number = None
    if is_set:
        set_equipment_tag = f"CFI-EMP-{next_form_seq:03d}-SET-{set_type_code}"
        set_item_number = f"SET-EMP-{next_form_seq:03d}-{set_type_code}"

    next_form_seq += 1

    # Create Item documents and form items
    record_items = []
    created_item_docs = []

    for comp_name in component_names:
        item_seq_str = f"{next_item_seq:04d}"
        item_number = f"ITM-{item_seq_str}"
        asset_tag = f"ITM-{item_seq_str}"
        next_item_seq += 1

        cat, eq_type, model_desc = infer_specs(comp_name, raw_brand, raw_itype)
        
        item_doc = {
            'itemNumber': item_number,
            'assetTag': asset_tag,
            'itemDescription': comp_name,
            'brandModel': model_desc,
            'serialNumber': 'N/A',
            'category': cat,
            'equipmentType': eq_type,
            'brand': brand_info['brand'],
            'legalOwner': brand_info['legalOwner'],
            'currentCondition': 'Good',
            'status': 'Assigned',
            'setTag': set_tag,
            'setEquipmentTag': set_equipment_tag,
            'setItemNumber': set_item_number,
            'currentAssignment': {
                'accountabilityType': acc_type,
                'targetGroup': target_group,
                'employee': primary_emp['_id'] if primary_emp else None,
                'employeeName': emp_info['name'],
                'employeeId': emp_info['employeeId'],
                'company': emp_info['company'],
                'department': emp_info['department'],
                'dateIssued': datetime(2026, 11, 12),
                'conditionAtIssuance': 'Good',
                'setTag': set_tag,
                'setEquipmentTag': set_equipment_tag,
                'setItemNumber': set_item_number,
            },
            'remarks': f"{set_tag or comp_name} — {comp_name} ({emp_info['name']})",
            'unitCost': 0,
            'installedComponents': [],
            'maintenanceHistory': [],
            'receivedDate': datetime(2026, 11, 12),
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        ins_item = db.items.insert_one(item_doc)
        item_id = ins_item.inserted_id
        created_item_docs.append((item_id, item_doc))
        total_created_items += 1

        # Form item subdocument
        form_item = {
            '_id': ObjectId(),
            'item': item_id,
            'itemNumber': item_number,
            'assetTag': asset_tag,
            'itemDescription': comp_name,
            'brandModel': model_desc,
            'serialNumber': 'N/A',
            'setTag': set_tag,
            'setEquipmentTag': set_equipment_tag,
            'setItemNumber': set_item_number,
            'dateIssued': datetime(2026, 11, 12),
            'conditionAtIssuance': 'Good',
            'remarks': f"{set_tag or comp_name} — {comp_name}",
            'status': 'Active'
        }
        record_items.append(form_item)

    # Create Accountability Record
    acc_record = {
        'formNumber': form_number,
        'accountabilityType': acc_type,
        'storeName': '',
        'targetGroup': target_group,
        'brand': brand_info['brand'],
        'company': brand_info['company'],
        'propertyOwnerCompany': brand_info['legalOwner'],
        'employee': primary_emp['_id'] if primary_emp else None,
        'employeeInfo': emp_info,
        'items': record_items,
        'status': 'Active',
        'issuance': {
            'date': datetime(2026, 11, 12),
            'releasedBy': 'IT Department / Asset Custodian',
            'approvedBy': 'Luigi Andrey Opalia',
            'employeeSignatureName': emp_info['name'],
            'employeeSignatureDate': datetime(2026, 11, 12),
            'conditionAcknowledgment': {
                'receivedInGoodCondition': True,
                'notedIssues': ''
            }
        },
        'companyResponsibilitiesText': f"""By signing this form, I acknowledge and agree that:
1. The equipment listed above remains the property of {brand_info['legalOwner']}.
2. I am responsible for safeguarding this equipment from loss, theft, or damage.
3. I will use the equipment in accordance with company policies, including IT security and acceptable use policies.
4. I will not install unauthorized software or allow unauthorized users access.
5. I will immediately report loss, theft, or malfunction to IT or my supervisor.
6. Upon knowledge of termination of employment, at least a week before the date of resignation or upon knowledge of request by company, I will return all equipment in good working condition (normal wear and tear excepted).
7. Failure to return company property may result in payroll deductions (where legally permitted) and/or legal action.""",
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }

    ins_rec = db.accountabilityrecords.insert_one(acc_record)
    rec_id = ins_rec.inserted_id
    total_created_forms += 1

    # Link accountabilityId back into items
    for item_id, item_doc in created_item_docs:
        db.items.update_one(
            {'_id': item_id},
            {
                '$set': {
                    'currentAssignment.accountabilityId': rec_id,
                    'currentAssignment.formNumber': form_number
                }
            }
        )

    # Also log initial ItemHistory for each item
    for item_id, item_doc in created_item_docs:
        history_entry = {
            'item': item_id,
            'itemNumber': item_doc['itemNumber'],
            'serialNumber': item_doc['serialNumber'],
            'action': 'Issued',
            'actor': 'IT Department',
            'employee': primary_emp['_id'] if primary_emp else None,
            'employeeName': emp_info['name'],
            'employeeId': emp_info['employeeId'],
            'department': emp_info['department'],
            'formNumber': form_number,
            'accountabilityId': rec_id,
            'date': datetime(2026, 11, 12),
            'condition': 'Good',
            'remarks': f"Initially issued on Form {form_number} to {emp_info['name']} ({emp_info['department']})",
            'performedBy': 'Luigi Andrey Opalia',
            'createdAt': datetime.now()
        }
        db.itemhistories.insert_one(history_entry)

    set_display = f" [Set: {set_tag} ({set_equipment_tag})]" if is_set else " [Standalone]"
    print(f"[{total_created_forms:02d}/63] {form_number}: {emp_info['name']} ({brand_info['brand']} / {emp_info['department']}){set_display} -> {len(record_items)} items")

print("\n======================================================")
print(f"IMPORT COMPLETE!")
print(f"Total Forms Created: {total_created_forms}")
print(f"Total Items Inserted: {total_created_items}")
print(f"Total Database Items Now: {db.items.count_documents({})}")
print(f"Total Database Accountability Records Now: {db.accountabilityrecords.count_documents({})}")
print("======================================================\n")
