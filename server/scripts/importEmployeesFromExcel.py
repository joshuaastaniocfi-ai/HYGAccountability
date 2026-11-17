import os
import sys
import datetime
import pandas as pd
import pymongo

EXCEL_PATH = r'c:\Users\ASUS\Downloads\Employees_20261112.xlsx'
MONGO_URI = 'mongodb://127.0.0.1:27017/'
DB_NAME = 'chawnah_accountability'

def run_import():
    print(f"Reading Excel file from: {EXCEL_PATH}")
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: File not found at {EXCEL_PATH}")
        sys.exit(1)

    df = pd.read_excel(EXCEL_PATH, sheet_name='Employees')
    print(f"Total rows in sheet: {len(df)}")

    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    emp_collection = db['employees']

    now = datetime.datetime.now(datetime.timezone.utc)
    records = []
    
    for idx, row in df.iterrows():
        emp_no = str(row['Employee No']).strip().upper()
        full_name = str(row['Full Name']).strip()
        first_name = str(row['First Name']).strip()
        mid_name = '' if pd.isna(row['Middle Name']) else str(row['Middle Name']).strip()
        last_name = str(row['Last Name']).strip()
        raw_suffix = '' if pd.isna(row['Suffix']) else str(row['Suffix']).strip()

        # Clean artifacts from HR export
        suffix = raw_suffix
        if raw_suffix.upper() in ['NONE', 'MALE']:
            suffix = ''
            if full_name.endswith(' NONE'):
                full_name = full_name[:-5].strip()
            elif full_name.endswith(' MALE'):
                full_name = full_name[:-5].strip()
        elif raw_suffix == 'BERT' and first_name == 'ALBERT':
            suffix = ''
            if full_name.endswith(' BERT'):
                full_name = full_name[:-5].strip()

        company = str(row['Company']).strip()
        dept = str(row['Department']).strip()
        pos = str(row['Position']).strip()

        doc = {
            'employeeId': emp_no,
            'name': full_name,
            'firstName': first_name,
            'middleName': mid_name,
            'lastName': last_name,
            'suffix': suffix,
            'company': company,
            'department': dept,
            'jobTitle': pos,
            'status': 'Active',
            'createdAt': now,
            'updatedAt': now,
        }
        records.append(doc)

    print(f"Prepared {len(records)} employee records.")

    # We use upsert on employeeId to be safe and idempotent
    inserted_count = 0
    updated_count = 0

    for doc in records:
        res = emp_collection.update_one(
            {'employeeId': doc['employeeId']},
            {'$set': doc},
            upsert=True
        )
        if res.upserted_id:
            inserted_count += 1
        elif res.modified_count > 0:
            updated_count += 1

    total_in_db = emp_collection.count_documents({})
    print(f"\nImport Summary:")
    print(f"  - Newly Inserted: {inserted_count}")
    print(f"  - Updated: {updated_count}")
    print(f"  - Total in DB: {total_in_db}")

    print("\nEmployees by Company in DB:")
    pipeline_comp = [
        {"$group": {"_id": "$company", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    for item in emp_collection.aggregate(pipeline_comp):
        print(f"  - {item['_id']}: {item['count']}")

    print("\nEmployees by Department in DB:")
    pipeline_dept = [
        {"$group": {"_id": "$department", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    for item in emp_collection.aggregate(pipeline_dept):
        print(f"  - {item['_id']}: {item['count']}")

if __name__ == '__main__':
    run_import()

