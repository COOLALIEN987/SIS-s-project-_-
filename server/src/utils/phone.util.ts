import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';

export const validateAndFormatPhone = (phone: string, defaultCountry: CountryCode = 'IN'): string | null => {
    try {
        // Pre-process: remove all non-digit characters except '+'
        let cleaned = phone.replace(/[^\d+]/g, '');

        // Handling Indian 0-prefixed numbers
        if (defaultCountry === 'IN' && cleaned.startsWith('0') && cleaned.length > 10 && !cleaned.startsWith('00')) {
            cleaned = '+91' + cleaned.substring(1);
        } else if (defaultCountry === 'IN' && cleaned.length === 10 && !cleaned.startsWith('+')) {
            cleaned = '+91' + cleaned;
        }

        const parsed = parsePhoneNumber(cleaned, defaultCountry);
        if (!parsed.isValid()) {
            return null;
        }

        const type = parsed.getType();
        // Allow anything valid that isn't explicitly a premium/pager type, or just allow all valid for now.
        // Google Maps provides various valid formats.
        if (type === 'PAGER' || type === 'UAN' || type === 'VOICEMAIL') {
            return null; // Skip non-contactable types
        }

        return parsed.format('E.164');
    } catch (error) {
        return null;
    }
};
