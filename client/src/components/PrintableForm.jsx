import React from 'react';
import { Printer, ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function getFormBrandAndLegalOwner(record) {
  const brandVal = (record.brand || record.employeeInfo?.brand || record.employee?.brand || '').trim();
  const companyVal = (record.company || record.employeeInfo?.company || record.employee?.company || '').trim();
  const lowerBrand = brandVal.toLowerCase();
  const lowerCompany = companyVal.toLowerCase();

  // Rule: For Goldilocks (even if employee is Cake Haven Inc., Cakes and Occasions Corp., Fresh Berry Foods Corp.),
  // all goldilocks equipment is under Chawnah Foods Inc.!
  if (
    lowerBrand.includes('goldilocks') ||
    lowerCompany.includes('goldilocks') ||
    lowerCompany.includes('chawnah') ||
    lowerCompany.includes('cake haven') ||
    lowerCompany.includes('cakes and occasions') ||
    lowerCompany.includes('fresh berry') ||
    lowerCompany.includes('cfi')
  ) {
    return {
      brand: 'Goldilocks',
      legalOwner: 'Chawnah Foods Inc.',
      employerCompany: companyVal || 'Chawnah Foods Inc.',
      logoSrc: '/website_logo.png',
      alt: 'Goldilocks / Chawnah Foods Inc. Logo',
      hasCustomLogo: true,
    };
  }

  // DU99: DU99 Commercial Corp.
  if (lowerBrand.includes('du99') || lowerCompany.includes('du99')) {
    return {
      brand: 'DU99',
      legalOwner: 'DU99 Commercial Corp.',
      employerCompany: 'DU99 Commercial Corp.',
      logoSrc: '/logos/du99.png',
      alt: 'DU99 Logo',
      hasCustomLogo: true,
    };
  }

  // Taters: Pop and Chips Specialist Inc.
  if (
    lowerBrand.includes('taters') ||
    lowerCompany.includes('taters') ||
    lowerCompany.includes('pop and chips')
  ) {
    return {
      brand: 'Taters',
      legalOwner: 'Pop and Chips Specialist Inc.',
      employerCompany: 'Pop and Chips Specialist Inc.',
      logoSrc: '/logos/taters.png',
      alt: 'Taters Logo',
      hasCustomLogo: true,
    };
  }

  // Icebergs: Cool Ice Food Desserts
  if (
    lowerBrand.includes('iceberg') ||
    lowerCompany.includes('iceberg') ||
    lowerCompany.includes('cool ice')
  ) {
    return {
      brand: 'Icebergs',
      legalOwner: 'Cool Ice Food Desserts',
      employerCompany: 'Cool Ice Food Desserts',
      logoSrc: '/logos/icebergs.png',
      alt: 'Icebergs Logo',
      hasCustomLogo: true,
    };
  }

  // Savore: Savore Kitchen Corp
  if (lowerBrand.includes('savore') || lowerCompany.includes('savore')) {
    return {
      brand: 'Savore',
      legalOwner: 'Savore Kitchen Corp',
      employerCompany: 'Savore Kitchen Corp',
      logoSrc: '/logos/savore.png',
      alt: 'Savore Logo',
      hasCustomLogo: true,
    };
  }

  // Chatime: Salu-salong Saya Food Inc.
  if (
    lowerBrand.includes('chatime') ||
    lowerCompany.includes('chatime') ||
    lowerCompany.includes('salu-salong') ||
    lowerCompany.includes('saya')
  ) {
    return {
      brand: 'Chatime',
      legalOwner: 'Salu-salong Saya Food Inc.',
      employerCompany: 'Salu-salong Saya Food Inc.',
      logoSrc: '/logos/chatime.png',
      alt: 'Chatime Logo',
      hasCustomLogo: true,
    };
  }

  return {
    brand: brandVal || 'Goldilocks',
    legalOwner: record.propertyOwnerCompany || companyVal || 'Chawnah Foods Inc.',
    employerCompany: companyVal || 'Chawnah Foods Inc.',
    logoSrc: null,
    alt: `${companyVal || 'Company'} Logo`,
    hasCustomLogo: false,
  };
}

export default function PrintableForm({ record, onReturnAll, onReturnComponent }) {
  const navigate = useNavigate();

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const hasActiveItems = record.items?.some((i) => i.status === 'Active');
  const allReturned = record.status === 'Returned';
  const isStore = record.accountabilityType === 'Store';
  const isDept = record.accountabilityType === 'Department';
  const isOffice = record.accountabilityType === 'Office';

  // Ensure table has at least 5 rows matching the official Word document template
  const totalRows = Math.max(5, record.items?.length || 0);
  const rows = [...(record.items || [])];
  while (rows.length < totalRows) {
    rows.push(null);
  }

  // Return inspection variables
  const retSummary = record.returnSummary || {};
  const retCondition = retSummary.conditionUponReturn || '';
  const completeness = retSummary.completeness || '';
  const incompleteNotes = retSummary.incompleteNotes || '';
  const charges = retSummary.chargesAssessment || '';
  const chargesAmount = retSummary.chargesAmount || '';
  const notes = retSummary.notes || '';

  // Brand & Legal Property Owner resolution
  // Rule: Legal property owner is the company, but for Goldilocks (all franchisees),
  // all equipment is owned by Chawnah Foods Inc.
  const brandInfo = getFormBrandAndLegalOwner(record);
  const legalOwner = brandInfo.legalOwner;
  const employerCompany = brandInfo.employerCompany;
  const brandName = brandInfo.brand;

  return (
    <div className="space-y-4 font-sans">
      {/* Top action bar (hidden during print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800 text-base">{record.formNumber}</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  record.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : record.status === 'Partially Returned'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {record.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Official {legalOwner} Accountability Document &bull; {brandName} Assets
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {hasActiveItems && onReturnAll && (
            <button
              onClick={onReturnAll}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Process Return</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Form</span>
          </button>
        </div>
      </div>

      {/* Official Form Sheet (Matches EMPLOYEE EQUIPMENT ACCOUNTABILITY FORM.docx) */}
      <div
        className="print-page bg-white border border-slate-300 rounded-lg p-4 sm:p-7 md:p-10 max-w-[850px] mx-auto shadow-md text-black text-[12px] leading-normal overflow-x-auto"
        style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
      >
        <div className="min-w-[620px] sm:min-w-0">
          {/* HEADER: Dynamic Company Logo on Left + Centered Company Text */}
        <div className="flex items-center justify-between pb-3">
          {/* Left Logo: Authentic Brand Logo or Clean Emblem */}
          <div className="w-36 shrink-0 flex items-center justify-start">
            {brandInfo.hasCustomLogo && brandInfo.logoSrc ? (
              <img
                src={brandInfo.logoSrc}
                alt={brandInfo.alt}
                className="h-14 w-auto object-contain max-w-[135px]"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-13 px-3 py-1 border border-slate-900 rounded bg-slate-50 flex flex-col items-center justify-center text-center max-w-[135px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-black leading-tight line-clamp-2">
                  {legalOwner}
                </span>
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                  {brandName} &bull; HYG Group
                </span>
              </div>
            )}
          </div>

          {/* Center Company Title */}
          <div className="text-center flex-1 px-2">
            <h1
              className="font-black text-lg text-black uppercase tracking-tight"
              style={{ fontFamily: '"Arial Black", Arial, sans-serif' }}
            >
              HYG Group of Companies
            </h1>
            <p className="font-bold text-sm text-black -mt-0.5">
              {legalOwner}
            </p>
            <p className="text-[11px] text-black">
              P. Burgos Street Tacloban City
            </p>
          </div>

          {/* Right spacer to keep center text perfectly balanced */}
          <div className="w-36 shrink-0"></div>
        </div>

        {/* Solid Straight Connector Rule */}
        <div className="border-b-[1.5pt] border-black mb-4"></div>

        {/* DOCUMENT TITLE */}
        <h2 className="text-center font-bold text-sm sm:text-base tracking-wide uppercase text-black mb-4">
          {isStore
            ? `STORE EQUIPMENT ACCOUNTABILITY FORM — [${record.storeName || 'BRANCH STORE'}]`
            : isDept
            ? `DEPARTMENT EQUIPMENT ACCOUNTABILITY FORM — [${record.employeeInfo?.department || 'DEPARTMENT'}]`
            : isOffice
            ? `OFFICE EQUIPMENT ACCOUNTABILITY FORM — [${record.targetGroup || 'OFFICE'}]`
            : 'EMPLOYEE EQUIPMENT ACCOUNTABILITY FORM'}
        </h2>

        {/* SECTION 1: EMPLOYEE INFORMATION */}
        <div className="mb-4 text-[12px]">
          <h3 className="font-bold text-[12px] text-black mb-1.5">
            {isStore
              ? 'Store & Custodian Information'
              : isDept
              ? 'Department & Custodian Information'
              : isOffice
              ? 'Office & Custodian Information'
              : 'Employee Information'}
          </h3>

          <div className="space-y-1">
            {isStore && (
              <div className="flex items-baseline">
                <span className="w-36 font-semibold shrink-0">Store Branch:</span>
                <span className="border-b border-black flex-1 font-bold text-black uppercase">
                  {record.storeName}
                </span>
              </div>
            )}

            {!isStore && (
              <>
                <div className="flex items-baseline">
                  <span className="w-36 shrink-0">Brand:</span>
                  <span className="border-b border-black flex-1 pb-0.5 font-bold text-black">
                    {brandName}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-36 shrink-0">Company / Employer:</span>
                  <span className="border-b border-black flex-1 pb-0.5 font-bold text-black">
                    {employerCompany}
                  </span>
                </div>
                {employerCompany !== legalOwner && (
                  <div className="flex items-baseline">
                    <span className="w-36 shrink-0">Property Owner:</span>
                    <span className="border-b border-black flex-1 pb-0.5 font-semibold text-black">
                      {legalOwner}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex items-baseline">
              <span className="w-36 shrink-0">
                {isStore ? 'Store Custodian / In-Charge:' : 'Employee Name:'}
              </span>
              <span className="border-b border-black flex-1 pb-0.5 font-bold text-black">
                {record.employeeInfo?.name || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 shrink-0">Employee ID:</span>
              <span className="border-b border-black flex-1 pb-0.5 font-bold text-black font-mono">
                {record.employeeInfo?.employeeId || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 shrink-0">Job Title:</span>
              <span className="border-b border-black flex-1 pb-0.5 text-black">
                {record.employeeInfo?.jobTitle || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="w-36 shrink-0">Department:</span>
              <span className="border-b border-black flex-1 pb-0.5 text-black">
                {record.employeeInfo?.department || ''}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: EQUIPMENT DETAILS */}
        <div className="mb-4">
          <h3 className="font-bold text-[12px] text-black mb-1">
            Equipment Details :
          </h3>

          <table className="w-full text-[11px] border border-black border-collapse">
            <thead>
              <tr className="border-b border-black text-black font-bold">
                <th className="p-1.5 border-r border-black text-left w-[24%]">
                  Item Name / Description
                </th>
                <th className="p-1.5 border-r border-black text-left w-[16%]">
                  Brand / Model
                </th>
                <th className="p-1.5 border-r border-black text-left w-[17%]">
                  Serial Number
                </th>
                <th className="p-1.5 border-r border-black text-center w-[13%]">
                  Date of Issuance
                </th>
                <th className="p-1.5 border-r border-black text-left w-[18%]">
                  Condition at Issuance
                </th>
                <th className="p-1.5 text-left w-[12%]">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((rowItem, idx) => {
                if (!rowItem) {
                  return (
                    <tr key={`blank-${idx}`} className="border-b border-black h-7">
                      <td className="p-1.5 border-r border-black">&nbsp;</td>
                      <td className="p-1.5 border-r border-black">&nbsp;</td>
                      <td className="p-1.5 border-r border-black">&nbsp;</td>
                      <td className="p-1.5 border-r border-black text-center">&nbsp;</td>
                      <td className="p-1.5 border-r border-black whitespace-nowrap">
                        <span className="space-x-1.5 text-black">
                          <span>☐ New</span>
                          <span>☐ Good</span>
                          <span>☐ Fair</span>
                        </span>
                      </td>
                      <td className="p-1.5">&nbsp;</td>
                    </tr>
                  );
                }

                const isNew = rowItem.conditionAtIssuance === 'New';
                const isGood = rowItem.conditionAtIssuance === 'Good';
                const isFair = rowItem.conditionAtIssuance === 'Fair';
                const itemDate = rowItem.dateIssued || record.issuance?.dateOfRelease || record.issuance?.date || record.createdAt;

                return (
                  <tr key={rowItem._id || idx} className="border-b border-black align-top">
                    <td className="p-1.5 border-r border-black font-semibold text-black">
                      <div>{rowItem.itemDescription || rowItem.equipment || rowItem.name}</div>
                      {rowItem.itemNumber && (
                        <span className="text-[10px] text-slate-600 font-mono block">
                          Tag: {rowItem.itemNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-1.5 border-r border-black text-black">
                      {rowItem.brandModel || rowItem.brand}
                    </td>
                    <td className="p-1.5 border-r border-black font-mono text-black">
                      {rowItem.serialNumber}
                    </td>
                    <td className="p-1.5 border-r border-black text-center whitespace-nowrap text-black font-medium">
                      {formatDate(itemDate)}
                    </td>
                    <td className="p-1.5 border-r border-black whitespace-nowrap">
                      <span className="space-x-1.5 font-bold text-black">
                        <span>{isNew ? '☑' : '☐'} New</span>
                        <span>{isGood ? '☑' : '☐'} Good</span>
                        <span>{isFair ? '☑' : '☐'} Fair</span>
                      </span>
                    </td>
                    <td className="p-1.5 text-black text-[10px]">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <div>{rowItem.remarks || rowItem.remark || ''}</div>
                          {rowItem.setTag && (
                            <span className="print:hidden inline-block text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded mt-0.5">
                              {rowItem.setTag}
                            </span>
                          )}
                          {rowItem.status === 'Returned' && (
                            <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded mt-0.5">
                              Returned {rowItem.returnDetails?.returnDate ? `(${formatDate(rowItem.returnDetails.returnDate)})` : ''}
                            </span>
                          )}
                        </div>
                        {rowItem.status === 'Active' && onReturnComponent && (
                          <button
                            type="button"
                            onClick={() => onReturnComponent(rowItem)}
                            className="print:hidden shrink-0 px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-2xs transition"
                            title="Return this component individually"
                          >
                            Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SECTION 3: EMPLOYEE RESPONSIBILITIES */}
        <div className="mb-4 text-[11px] leading-relaxed text-black">
          <h3 className="font-bold text-[12px] text-black mb-0.5">
            Employee Responsibilities :
          </h3>
          <p className="mb-1 text-black font-medium">
            By signing this form, I acknowledge and agree that:
          </p>
          <ul className="list-disc pl-5 space-y-0.5 text-black">
            <li>
              <strong>The equipment listed above remains the property of {legalOwner}.</strong>
            </li>
            <li>I am responsible for safeguarding this equipment from loss, theft, or damage.</li>
            <li>I will use the equipment in accordance with company policies, including IT security and acceptable use policies.</li>
            <li>I will not install unauthorized software or allow unauthorized users access.</li>
            <li>I will immediately report loss, theft, or malfunction to IT or my supervisor.</li>
            <li>
              <strong>Upon knowledge of termination of employment</strong> , at least a week before the date of resignation or upon knowledge of request by company, I will return all equipment in good working condition (normal wear and tear excepted).
            </li>
            <li>Failure to return company property may result in payroll deductions (where legally permitted) and/or legal action.</li>
          </ul>
        </div>

        {/* SECTION 4: CONDITION ACKNOWLEDGMENT */}
        <div className="mb-4 text-[11px] text-black">
          <h3 className="font-bold text-[12px] text-black mb-0.5">
            Condition Acknowledgment
          </h3>
          <p className="font-medium mb-1 text-black">
            I confirm that I have inspected the equipment and received it in the condition indicated above.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="font-semibold text-black">
              {record.issuance?.conditionAcknowledgment?.receivedInGoodCondition !== false ? '☑' : '☐'} Equipment received in good working condition
            </span>
            <div className="flex items-baseline flex-1 min-w-[240px]">
              <span className="mr-1.5 shrink-0">
                {record.issuance?.conditionAcknowledgment?.notedIssues ? '☑' : '☐'} Noted issues (if any):
              </span>
              <span className="border-b border-black flex-1 font-medium pb-0.5">
                {record.issuance?.conditionAcknowledgment?.notedIssues || '__________________________________________'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5: SIGNATURES & INSPECTOR SECTION */}
        <div className="mb-4 text-xs">
          {/* Employee Signature and Date Row */}
          <div className="grid grid-cols-12 gap-6 pt-2 items-end">
            <div className="col-span-8 text-center">
              <div className="border-b border-black pb-0.5 min-h-[36px] flex flex-col justify-end items-center font-bold text-black">
                {record.issuance?.employeeSignatureImage ? (
                  <img
                    src={record.issuance.employeeSignatureImage}
                    alt="Signature"
                    className="max-h-9 object-contain"
                  />
                ) : null}
                <span>{record.issuance?.employeeSignatureName || record.employeeInfo?.name}</span>
              </div>
              <p className="text-[11px] text-black mt-1">
                Employee ’ s Signature over Printed Name
              </p>
            </div>

            <div className="col-span-4 text-center">
              <div className="border-b border-black pb-0.5 min-h-[36px] flex flex-col justify-end items-center font-bold text-black font-mono">
                {formatDate(record.issuance?.date || record.issuance?.dateOfRelease)}
              </div>
              <p className="text-[11px] text-black mt-1">
                Date
              </p>
            </div>
          </div>

          {/* Boxed Inspector Section */}
          <div className="border border-black mt-4 p-3 bg-white">
            <div className="text-center font-bold text-[11px] uppercase tracking-wide text-black mb-3">
              To be completed by Inspector
            </div>
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-black pb-0.5 min-h-[20px] font-bold text-black">
                  {record.issuance?.releasedBy || ''}
                </div>
                <div className="text-[11px] text-black mt-1">Released By</div>
              </div>
              <div>
                <div className="border-b border-black pb-0.5 min-h-[20px] font-bold text-black">
                  {record.issuance?.approvedBy || ''}
                </div>
                <div className="text-[11px] text-black mt-1">Approved By</div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Divider Line */}
        <div className="border-b-[1.5pt] border-black my-4"></div>

        {/* SECTION 6: RETURN INFORMATION */}
        <div className="text-[11px] text-black">
          <div className="flex items-center justify-between font-bold text-[12px] mb-2">
            <span>Return Information</span>
            <div className="flex items-baseline text-[11px]">
              <span className="mr-2">Date:</span>
              <span className="border-b border-black w-36 font-normal font-mono pb-0.5 text-center">
                {formatDate(retSummary.returnDate) || '_______________________'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            <div className="flex items-center space-x-4">
              <span className="font-semibold">Condition Upon Return:</span>
              <span>{retCondition === 'Excellent' ? '☑' : '☐'} Excellent</span>
              <span>{retCondition === 'Good' ? '☑' : '☐'} Good</span>
              <span>{retCondition === 'Fair' ? '☑' : '☐'} Fair</span>
              <span>{retCondition === 'Damaged' ? '☑' : '☐'} Damaged</span>
            </div>

            <div className="flex items-baseline space-x-3">
              <span className="font-semibold shrink-0">Return Completeness :</span>
              <span>{completeness === 'Complete' ? '☑' : '☐'} Complete</span>
              <span className="flex-1 flex items-baseline">
                <span className="mr-1">{completeness === 'Incomplete' ? '☑' : '☐'} Incomplete:</span>
                <span className="border-b border-black flex-1 text-[11px] pl-1 font-mono">
                  {incompleteNotes || '___________________'}
                </span>
              </span>
            </div>

            <div className="flex items-baseline space-x-3">
              <span className="font-semibold shrink-0">Charges Assessment :</span>
              <span>{charges === 'No charges' || (!retSummary.returnDate && !charges) ? '☑' : '☐'} No charges</span>
              <span className="flex items-baseline">
                <span className="mr-1">{charges === 'Charges Applicable' ? '☑' : '☐'} Charges Applicable:</span>
                <span>₱</span>
                <span className="border-b border-black px-2 font-mono font-bold">
                  {chargesAmount ? Number(chargesAmount).toFixed(2) : '______ .00'}
                </span>
              </span>
            </div>

            <div className="pt-1">
              <div className="flex items-baseline">
                <span className="font-semibold mr-2 shrink-0">Notes:</span>
                <span className="border-b border-black flex-1 text-[11px] pb-0.5">
                  {notes || '__________________________________________________________________________'}
                </span>
              </div>
              <div className="border-b border-black h-4 w-full mt-1"></div>
            </div>
          </div>

          {/* 3 Return Signature Lines */}
          <div className="grid grid-cols-3 gap-6 pt-5 text-center text-xs">
            <div>
              <div className="border-b border-black pb-0.5 min-h-[22px] font-bold text-black">
                {retSummary.approvedBy || ''}
              </div>
              <div className="text-[11px] font-semibold text-black mt-1">Approved By</div>
            </div>

            <div>
              <div className="border-b border-black pb-0.5 min-h-[22px] font-bold text-black">
                {retSummary.inspectedBy || ''}
              </div>
              <div className="text-[11px] font-semibold text-black mt-1">Inspected By</div>
            </div>

            <div>
              <div className="border-b border-black pb-0.5 min-h-[22px] font-bold text-black">
                {retSummary.employeeSignature || ''}
              </div>
              <div className="text-[11px] font-semibold text-black mt-1">
                Employee’s Signature over Printed Name
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
