import RequestHandler from "./RequestHandler";

// ─── Domain model interfaces ──────────────────────────────────────────────────

/** Represents a single gate entry transaction record from the API. */
export interface GateEntry {
    id: number;
    gate_in: string;
    gate_out: string | null;
    block_location: string;
    row_location: number;
    col_location: number;
    tier_location: number | null;
    container_no: string;
    transaction_nbr: string;
    shipping_line: string;
    life_state: 'active' | 'inactive';
    booking_no: string;
    iso_code: string;
    category: string;
    reefer_reqt: string;
    seal_no: string | null;
    move_type: string;
    transport_company: string;
    drivers_name: string;
    driver_licence: string | null;
    plate_no: string;
    gross_weight: number;
    tare_weight: number;
    net_weight: number;
    vgm_weight: number | null;
    entry_lane: string | null;
    exit_lane: string | null;
    mnr_status: string;
    damage_code: string | null;
    inspection_notes: string | null;
    gate_inspector: string | null;
    trans_creator: string;
    person_incharge: string | null;
    // Gate-in payment fields
    gate_in_payment_status: 'paid' | 'unpaid';
    gate_in_payment_amount: number | null;
    gate_in_payment_method: string | null;
    gate_in_payment_date: string | null;
    gate_in_payment_reference: string | null;
    gate_in_payment_need: number | null;
    // Gate-out payment fields
    payment_status: string;
    payment_need: number | null;
    payment_amount: number | null;
    payment_method: string | null;
    payment_date: string | null;
    payment_reference: string | null;
    // Virtual / computed field — not stored in DB
    days_in_yard?: number;
    createdAt: string;
    updatedAt: string;
}

/** Represents a shipping line record. */
export interface ShippingLine {
    id: number;
    code: string;
    name: string;
    email: string | null;
    life_state: 'Active' | 'Inactive';
    createdAt: string;
    updatedAt: string;
}

/** Represents a driver record. */
export interface Driver {
    id: number;
    name: string;
    licenseNumber: string;
    status: 'active' | 'banned';
    lifeState: 'active' | 'deceased';
    createdAt: string;
    updatedAt: string;
}

/** Represents a vehicle plate number record. */
export interface PlateNumber {
    id: number;
    plate_no: string;
    createdAt: string;
    updatedAt: string;
}

/** Represents a transport company record. */
export interface TransportCompany {
    id: number;
    name: string;
    code: string;
    status: 'active' | 'banned';
    createdAt: string;
    updatedAt: string;
}

// ─── Raw API response shapes ──────────────────────────────────────────────────

interface GateEntriesResponse {
    success: boolean;
    gateEntries: GateEntry[];
}

interface ShippingLinesResponse {
    success: boolean;
    shippingLines: ShippingLine[];
}

interface DriversResponse {
    success: boolean;
    drivers: Driver[];
}

interface PlateNumbersResponse {
    success: boolean;
    plateNumbers: PlateNumber[];
}

interface TransportCompaniesResponse {
    success: boolean;
    transportCompanies: TransportCompany[];
}

// ─── Aggregated dashboard payload ────────────────────────────────────────────

/** Combined data structure returned by the parallel dashboard loader. */
export interface DashboardData {
    gateEntries: GateEntry[];
    shippingLines: ShippingLine[];
    drivers: Driver[];
    plateNumbers: PlateNumber[];
    transportCompanies: TransportCompany[];
}

// ─── Individual fetchers ──────────────────────────────────────────────────────

/**
 * Fetches all gate entry records from the API.
 * Returns an empty array and logs a warning/error on failure.
 */
export async function fetchGateEntries(): Promise<GateEntry[]> {
    try {
        const res: GateEntriesResponse = await RequestHandler.fetchData('GET', 'gate-entry/get-all');
        if (res?.success && Array.isArray(res.gateEntries)) return res.gateEntries;
        console.warn('[DashboardFetcher] fetchGateEntries: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchGateEntries failed:', err);
        return [];
    }
}

/**
 * Fetches all shipping line records from the API.
 * Returns an empty array and logs a warning/error on failure.
 */
export async function fetchShippingLines(): Promise<ShippingLine[]> {
    try {
        const res: ShippingLinesResponse = await RequestHandler.fetchData('GET', 'shipping-lines/get-all');
        if (res?.success && Array.isArray(res.shippingLines)) return res.shippingLines;
        console.warn('[DashboardFetcher] fetchShippingLines: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchShippingLines failed:', err);
        return [];
    }
}

/**
 * Fetches all driver records from the API.
 * Returns an empty array and logs a warning/error on failure.
 */
export async function fetchDrivers(): Promise<Driver[]> {
    try {
        const res: DriversResponse = await RequestHandler.fetchData('GET', 'drivers/get-all');
        if (res?.success && Array.isArray(res.drivers)) return res.drivers;
        console.warn('[DashboardFetcher] fetchDrivers: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchDrivers failed:', err);
        return [];
    }
}

/**
 * Fetches all plate number records from the API.
 * Returns an empty array and logs a warning/error on failure.
 */
export async function fetchPlateNumbers(): Promise<PlateNumber[]> {
    try {
        const res: PlateNumbersResponse = await RequestHandler.fetchData('GET', 'plate-numbers/get-all');
        if (res?.success && Array.isArray(res.plateNumbers)) return res.plateNumbers;
        console.warn('[DashboardFetcher] fetchPlateNumbers: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchPlateNumbers failed:', err);
        return [];
    }
}

/**
 * Fetches all transport company records from the API.
 * Returns an empty array and logs a warning/error on failure.
 */
export async function fetchTransportCompanies(): Promise<TransportCompany[]> {
    try {
        const res: TransportCompaniesResponse = await RequestHandler.fetchData('GET', 'transport-companies/get-all');
        if (res?.success && Array.isArray(res.transportCompanies)) return res.transportCompanies;
        console.warn('[DashboardFetcher] fetchTransportCompanies: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchTransportCompanies failed:', err);
        return [];
    }
}

// ─── Main loader — fetches everything in parallel ─────────────────────────────

/**
 * Fires all five individual fetchers concurrently using Promise.all
 * and returns the aggregated DashboardData payload.
 * Individual failures are silently swallowed and returned as empty arrays.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
    const [
        gateEntries,
        shippingLines,
        drivers,
        plateNumbers,
        transportCompanies,
    ] = await Promise.all([
        fetchGateEntries(),
        fetchShippingLines(),
        fetchDrivers(),
        fetchPlateNumbers(),
        fetchTransportCompanies(),
    ]);

    return {
        gateEntries,
        shippingLines,
        drivers,
        plateNumbers,
        transportCompanies,
    };
}

// ─── Date-range helpers (used by Dashboard + Reports) ────────────────────────

/**
 * Returns a new Date set to the start boundary of the given unit.
 * - 'day'   → 00:00:00.000 of the same day
 * - 'week'  → 00:00:00.000 of the preceding Sunday
 * - 'month' → 00:00:00.000 of the 1st of the month
 */
export function startOf(date: Date, unit: 'day' | 'week' | 'month'): Date {
    const d = new Date(date);
    if (unit === 'day')   { d.setHours(0, 0, 0, 0); return d; }
    if (unit === 'week')  { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }
    d.setDate(1); d.setHours(0, 0, 0, 0); return d; // month
}

/**
 * Returns a new Date set to the end boundary of the given unit.
 * - 'day'   → 23:59:59.999 of the same day
 * - 'week'  → 23:59:59.999 of the following Saturday
 * - 'month' → 23:59:59.999 of the last day of the month
 */
export function endOf(date: Date, unit: 'day' | 'week' | 'month'): Date {
    const d = new Date(date);
    if (unit === 'day')   { d.setHours(23, 59, 59, 999); return d; }
    if (unit === 'week')  { d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(23, 59, 59, 999); return d; }
    d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); return d; // month
}

/**
 * Filters an array of gate entries to only those whose gate_in timestamp
 * falls within the inclusive [from, to] date range.
 */
export function filterByRange(entries: GateEntry[], from: Date, to: Date): GateEntry[] {
    return entries.filter(e => {
        const d = new Date(e.gate_in);
        return d >= from && d <= to;
    });
}

// ─── Safe number coercion ─────────────────────────────────────────────────────

/**
 * Safely coerces any API value to a number.
 * Necessary because the API may return numeric fields as strings —
 * using `?? 0` would keep the string type and cause string concatenation
 * instead of numeric addition when summing totals.
 * Returns 0 for null, undefined, or non-numeric values.
 */
const toN = (val: unknown): number => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

// ─── Payment summary helper ───────────────────────────────────────────────────

/** Aggregated payment metrics derived from a set of gate entries. */
export interface PaymentSummary {
    totalGateIn: number;        // Sum of all gate-in payment amounts
    totalGateOut: number;       // Sum of all gate-out payment amounts
    totalRevenue: number;       // totalGateIn + totalGateOut
    totalUnpaidGateIn: number;  // Sum of outstanding gate-in amounts
    totalUnpaidGateOut: number; // Sum of outstanding gate-out amounts
    paidGICount: number;        // Count of paid gate-in entries
    unpaidGICount: number;      // Count of unpaid gate-in entries
    paidGOCount: number;        // Count of paid gate-out entries (with gate_out set)
    unpaidGOCount: number;      // Count of unpaid gate-out entries (with gate_out set)
    totalExpected: number;      // Total expected revenue across all entries
    collectionRate: number;     // Percentage of expected revenue actually collected
}

/**
 * Computes aggregated payment metrics from an array of gate entries.
 * All monetary values are coerced through toN() to guard against
 * string-typed amounts returned by the API.
 */
export function computePaymentSummary(entries: GateEntry[]): PaymentSummary {
    const totalGateIn  = entries.reduce((s, e) => s + toN(e.gate_in_payment_amount), 0);
    const totalGateOut = entries.reduce((s, e) => s + toN(e.payment_amount), 0);
    const totalRevenue = totalGateIn + totalGateOut;

    // Sum the outstanding amounts only for unpaid entries
    const totalUnpaidGateIn  = entries
        .filter(e => e.gate_in_payment_status === 'unpaid')
        .reduce((s, e) => s + toN(e.gate_in_payment_need), 0);
    const totalUnpaidGateOut = entries
        .filter(e => e.payment_status === 'unpaid')
        .reduce((s, e) => s + toN(e.payment_need), 0);

    const paidGICount   = entries.filter(e => e.gate_in_payment_status === 'paid').length;
    const unpaidGICount = entries.filter(e => e.gate_in_payment_status === 'unpaid').length;
    // Gate-out counts only consider entries that have actually exited (gate_out is set)
    const paidGOCount   = entries.filter(e => e.payment_status === 'paid'   && e.gate_out).length;
    const unpaidGOCount = entries.filter(e => e.payment_status === 'unpaid' && e.gate_out).length;

    // Total expected = sum of all required gate-in and gate-out amounts
    const totalExpected = entries.reduce(
        (s, e) => s + toN(e.gate_in_payment_need) + toN(e.payment_need), 0
    );
    // Collection rate = percentage of expected revenue that has been collected
    const collectionRate = totalExpected > 0
        ? Math.round((totalRevenue / totalExpected) * 100)
        : 0;

    return {
        totalGateIn, totalGateOut, totalRevenue,
        totalUnpaidGateIn, totalUnpaidGateOut,
        paidGICount, unpaidGICount,
        paidGOCount, unpaidGOCount,
        totalExpected, collectionRate,
    };
}