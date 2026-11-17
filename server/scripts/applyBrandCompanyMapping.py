import pymongo

MONGO_URI = 'mongodb://127.0.0.1:27017/'
DB_NAME = 'chawnah_accountability'

# Mapping rule based on user prompt:
# DU99: DU99 Commercial Corp.
# Goldilocks: Chawnah Foods Inc., Cake Haven Inc., Cakes and Occasions Corp., Fresh Berry Foods Corp.
# Taters: Pop and Chips Specialist Inc.
# Icebergs: Cool Ice Food Desserts
# Savore: Savore Kitchen Corp
# Chatime: Salu-salong Saya Food Inc.
# Legal owner for all Goldilocks equipment: Chawnah Foods Inc.

MAPPING = {
    'DU99': {
        'brand': 'DU99',
        'company': 'DU99 Commercial Corp.',
        'legalOwner': 'DU99 Commercial Corp.',
    },
    'Chawnah Foods Inc.': {
        'brand': 'Goldilocks',
        'company': 'Chawnah Foods Inc.',
        'legalOwner': 'Chawnah Foods Inc.',
    },
    'Cake Haven Inc.': {
        'brand': 'Goldilocks',
        'company': 'Cake Haven Inc.',
        'legalOwner': 'Chawnah Foods Inc.',
    },
    'Cakes and Occasions Corp.': {
        'brand': 'Goldilocks',
        'company': 'Cakes and Occasions Corp.',
        'legalOwner': 'Chawnah Foods Inc.',
    },
    'Fresh Berry Foods Corp.': {
        'brand': 'Goldilocks',
        'company': 'Fresh Berry Foods Corp.',
        'legalOwner': 'Chawnah Foods Inc.',
    },
    'Taters': {
        'brand': 'Taters',
        'company': 'Pop and Chips Specialist Inc.',
        'legalOwner': 'Pop and Chips Specialist Inc.',
    },
    'Icebergs': {
        'brand': 'Icebergs',
        'company': 'Cool Ice Food Desserts',
        'legalOwner': 'Cool Ice Food Desserts',
    },
    'Savore': {
        'brand': 'Savore',
        'company': 'Savore Kitchen Corp',
        'legalOwner': 'Savore Kitchen Corp',
    },
    'Chatime': {
        'brand': 'Chatime',
        'company': 'Salu-salong Saya Food Inc.',
        'legalOwner': 'Salu-salong Saya Food Inc.',
    },
    '7/11': {
        'brand': '7/11',
        'company': '7/11',
        'legalOwner': '7/11',
    },
}

def run_migration():
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]

    print("=== 1. Updating Employees with Brand, Company & Legal Owner ===")
    emp_col = db.employees
    employees = list(emp_col.find())
    print(f"Total employees to evaluate: {len(employees)}")

    updated_emps = 0
    for emp in employees:
        raw_comp = emp.get('company', '').strip()
        matched = MAPPING.get(raw_comp)

        if not matched:
            # Check by partial match
            for key, val in MAPPING.items():
                if key.lower() in raw_comp.lower() or raw_comp.lower() in key.lower():
                    matched = val
                    break

        if not matched:
            matched = {
                'brand': 'Goldilocks',
                'company': raw_comp or 'Chawnah Foods Inc.',
                'legalOwner': 'Chawnah Foods Inc.'
            }

        emp_col.update_one(
            {'_id': emp['_id']},
            {
                '$set': {
                    'brand': matched['brand'],
                    'company': matched['company'],
                    'legalOwnerCompany': matched['legalOwner']
                }
            }
        )
        updated_emps += 1

    print(f"Updated {updated_emps} employee documents.")

    print("\nEmployee Count by Brand:")
    for b in emp_col.aggregate([{'$group': {'_id': '$brand', 'count': {'$sum': 1}}}, {'$sort': {'count': -1}}]):
        print(f"  - {b['_id']}: {b['count']}")

    print("\nEmployee Count by Company:")
    for c in emp_col.aggregate([{'$group': {'_id': {'brand': '$brand', 'company': '$company', 'legalOwner': '$legalOwnerCompany'}, 'count': {'$sum': 1}}}, {'$sort': {'count': -1}}]):
        info = c['_id']
        print(f"  - Brand: {info['brand']:<10} | Company: {info['company']:<28} | Legal Owner: {info['legalOwner']:<25} ({c['count']})")

    print("\n=== 2. Updating Equipment Items with Brand & Legal Owner ===")
    items_col = db.items
    res_items = items_col.update_many(
        {},
        {
            '$set': {
                'brand': 'Goldilocks',
                'legalOwner': 'Chawnah Foods Inc.'
            }
        }
    )
    print(f"Updated {res_items.modified_count} items to brand 'Goldilocks' and legalOwner 'Chawnah Foods Inc.'.")

    print("\n=== 3. Updating Store Accountability Records ===")
    acc_col = db.accountabilityrecords
    res_acc = acc_col.update_many(
        {},
        {
            '$set': {
                'brand': 'Goldilocks',
                'company': 'Chawnah Foods Inc.',
                'propertyOwnerCompany': 'Chawnah Foods Inc.',
                'companyResponsibilitiesText': """By signing this form, I acknowledge and agree that:
1. The equipment listed above remains the property of Chawnah Foods Inc. .
2. I am responsible for safeguarding this equipment from loss, theft, or damage.
3. I will use the equipment in accordance with company policies, including IT security and acceptable use policies.
4. I will not install unauthorized software or allow unauthorized users access.
5. I will immediately report loss, theft, or malfunction to IT or my supervisor.
6. Upon knowledge of termination of employment, at least a week before the date of resignation or upon knowledge of request by company, I will return all equipment in good working condition (normal wear and tear excepted).
7. Failure to return company property may result in payroll deductions (where legally permitted) and/or legal action."""
            }
        }
    )
    print(f"Updated {res_acc.modified_count} accountability records.")

if __name__ == '__main__':
    run_migration()

