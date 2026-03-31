import React from 'react';

/**
 * Formats a date-time string into a human-readable locale string (MM/DD/YYYY, HH:MM AM/PM).
 * Returns "N/A" if the value is null, undefined, or an empty string.
 *
 * @param value - An ISO date string or any value parseable by the Date constructor
 * @returns Formatted date-time string e.g. "03/30/2026, 9:45 AM", or "N/A"
 */
function formatDateTime(value: string | null) {
    if (!value) return "N/A";
    const date = new Date(value);
    return date.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

interface EquipmentInterchangeReceiptProps {
  data: {
    gate_in: string;
    gate_out: string;
    transaction_nbr: string;
    location: string;
    shipping_line: string;
    container_no: string;
    booking_no: string;
    iso_code: string;
    category: string;
    seal_no: string;
    reefer_reqt: string;
    transport_company: string;
    drivers_name: string;
    driver_licence: string;
    plate_no: string;
    move_type: string;
    entry_lane: string;
    exit_lane: string;
    mnr_status: string;
    damage_code: string;
    inspection_notes: string;
    gate_inspector: string;
    gross_weight: string;
    tare_weight: string;
    net_weight: string;
    vgm_weight: string;
  };
}

/**
 * EquipmentInterchangeReceipt component — renders a thermal-style 80mm receipt
 * for a container gate entry/exit transaction.
 *
 * Layout sections:
 * - Header: title and transaction number
 * - Gate Info: gate-in/out timestamps and location
 * - Container details: shipping line, container number, booking, ISO code, etc.
 * - Transport details: company, driver, license, plate, move type, lanes
 * - Inspection details: MNR status, damage code, notes, inspector
 * - Weight summary: gross, tare, net, and VGM weights
 * - Driver signature line
 * - Footer with timestamp
 *
 * Print styles are injected via a <style> tag to format the page as 80mm wide
 * and hide everything outside the receipt when printing.
 *
 * @param data - All gate entry fields needed to populate the receipt
 */
const EquipmentInterchangeReceipt: React.FC<EquipmentInterchangeReceiptProps> = ({ data }) => {

  /**
   * Returns the value as-is if it is truthy, otherwise falls back to the string 'N/A'.
   * Used to safely display optional or potentially empty receipt fields.
   *
   * @param value - A string value from the gate entry data, which may be null or undefined
   * @returns The original value, or 'N/A' if falsy
   */
  const getValue = (value: string | null | undefined) => (value ? value : 'N/A');

  return (
    <>
      {/* Inject print-specific styles to constrain the page to 80mm receipt width
          and hide all other page content outside the receipt root element */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body * { visibility: hidden; }
          .receipt-root, .receipt-root * { visibility: visible; }
          .receipt-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Receipt root container — fixed at 80mm width with monospace font to mimic thermal paper */}
      <div
        className="receipt-root bg-white text-black mx-auto"
        style={{
          width: '80mm',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '8px',
          lineHeight: '1.2',
          padding: '4px 6px',
        }}
      >
        {/* Header — receipt title and transaction number */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.5px' }}>
            EQUIPMENT INTERCHANGE
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.5px' }}>
            RECEIPT
          </div>
          <div style={{ borderTop: '1px dashed #000', marginTop: '4px', paddingTop: '4px', fontSize: '9px' }}>
            TXN#: {getValue(data.transaction_nbr)}
          </div>
        </div>

        {/* Dashed divider */}
        <div style={{ borderTop: '1px dashed #000', marginBottom: '4px' }} />

        {/* IIFE used to define and scope the Row and Section helper components locally,
            keeping them out of the module scope since they are only needed in this render */}
        {(() => {
          /**
           * Renders a single label-value row within the receipt.
           * The label is left-aligned in a fixed-width muted style;
           * the value is right-aligned and bold.
           *
           * @param label - The field name shown on the left (e.g. "Gate In")
           * @param value - The field value shown on the right (e.g. "03/30/2026, 9:45 AM")
           */
          const Row = ({ label, value }: { label: string; value: string }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', gap: '4px' }}>
              <span style={{ color: '#555', whiteSpace: 'nowrap', minWidth: '80px' }}>{label}:</span>
              <span style={{ fontWeight: '600', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
            </div>
          );

          /**
           * Renders a small uppercase section heading with a bottom border,
           * used to visually separate groups of rows within the receipt.
           *
           * @param title - The section heading text (e.g. "Gate Info", "Weight")
           */
          const Section = ({ title }: { title: string }) => (
            <div style={{ fontWeight: 'bold', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #ccc', marginTop: '3px', marginBottom: '2px', paddingBottom: '1px', color: '#333' }}>
              {title}
            </div>
          );

          return (
            <>
              {/* Gate Info section */}
              <Section title="Gate Info" />
              <Row label="Gate In"       value={formatDateTime(data.gate_in)} />
              <Row label="Gate Out"      value={formatDateTime(data.gate_out)} />
              <Row label="Location"      value={getValue(data.location)} />

              {/* Container details */}
              <Row label="Shipping Line" value={getValue(data.shipping_line)} />
              <Row label="Container No"  value={getValue(data.container_no)} />
              <Row label="Booking No"    value={getValue(data.booking_no)} />
              <Row label="ISO Code"      value={getValue(data.iso_code)} />
              <Row label="Category"      value={getValue(data.category)} />
              <Row label="Seal No"       value={getValue(data.seal_no)} />
              <Row label="Reefer REQT"   value={getValue(data.reefer_reqt)} />

              {/* Transport details */}
              <Row label="Company"       value={getValue(data.transport_company)} />
              <Row label="Driver"        value={getValue(data.drivers_name)} />
              <Row label="License"       value={getValue(data.driver_licence)} />
              <Row label="Plate No"      value={getValue(data.plate_no)} />
              <Row label="Move Type"     value={getValue(data.move_type)} />
              <Row label="Entry Lane"    value={getValue(data.entry_lane)} />
              <Row label="Exit Lane"     value={getValue(data.exit_lane)} />

              {/* Inspection details */}
              <Row label="MNR Status"    value={getValue(data.mnr_status)} />
              <Row label="Damage Code"   value={getValue(data.damage_code)} />
              <Row label="Notes"         value={getValue(data.inspection_notes)} />
              <Row label="Inspector"     value={getValue(data.gate_inspector)} />

              {/* Weight summary — all values displayed in kilograms */}
              <Row label="Gross"         value={`${getValue(data.gross_weight)} kg`} />
              <Row label="Tare"          value={`${getValue(data.tare_weight)} kg`} />
              <Row label="Net"           value={`${getValue(data.net_weight)} kg`} />
              <Row label="VGM"           value={`${getValue(data.vgm_weight)} kg`} />
            </>
          );
        })()}

        {/* Dashed divider before signature */}
        <div style={{ borderTop: '1px dashed #000', marginTop: '8px', marginBottom: '8px' }} />

        {/* Driver signature line */}
        <div style={{ textAlign: 'center', fontSize: '9px' }}>
          <div>Driver Signature:</div>
          <div style={{ borderBottom: '1px solid #000', margin: '12px 16px 4px' }} />
          <div style={{ fontSize: '8px', color: '#666' }}>Sign above</div>
        </div>

        {/* Footer — thank you note and print timestamp */}
        <div style={{ borderTop: '1px dashed #000', marginTop: '8px', paddingTop: '4px', textAlign: 'center', fontSize: '8px', color: '#666' }}>
          <div>Thank you</div>
          <div style={{ marginTop: '2px' }}>{new Date().toLocaleString()}</div>
        </div>
      </div>
    </>
  );
};

export default EquipmentInterchangeReceipt;