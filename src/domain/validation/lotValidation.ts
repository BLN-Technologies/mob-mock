export interface LotValidationInput {
  cropName: string;
  variety?: string;
  totalQuantityKg: number;
  pricePerKgRwf: number;
  harvestDate: string; // YYYY-MM-DD
  availabilityDate: string; // YYYY-MM-DD
  pickupDistrict: string;
  pickupSector: string;
  pickupLocationDetails: string;
  photos: string[];
  harvestConfirmed: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateLotDeclaration(input: LotValidationInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.cropName || input.cropName.trim().length === 0) {
    errors.cropName = 'Crop name is required';
  }

  // BR-01: Must confirm crop has been harvested
  if (!input.harvestConfirmed) {
    errors.harvestConfirmed = 'Only harvest-ready produce can be listed. Pre-harvest listings are not permitted in V1 (BR-01).';
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const harvest = new Date(input.harvestDate);

  if (isNaN(harvest.getTime())) {
    errors.harvestDate = 'A valid harvest date is required';
  } else if (harvest > today) {
    errors.harvestDate = 'Harvest date cannot be in the future (BR-01)';
  }

  const availability = new Date(input.availabilityDate);
  if (isNaN(availability.getTime())) {
    errors.availabilityDate = 'A valid availability date is required';
  } else if (!isNaN(harvest.getTime()) && availability < harvest) {
    errors.availabilityDate = 'Availability date cannot be earlier than harvest date';
  }

  if (typeof input.totalQuantityKg !== 'number' || isNaN(input.totalQuantityKg) || input.totalQuantityKg <= 0) {
    errors.totalQuantityKg = 'Quantity must be greater than zero';
  } else if (input.totalQuantityKg < 50) {
    errors.totalQuantityKg = 'Minimum commercial lot quantity is 50 kg';
  }

  if (typeof input.pricePerKgRwf !== 'number' || isNaN(input.pricePerKgRwf) || input.pricePerKgRwf <= 0) {
    errors.pricePerKgRwf = 'Expected price per kg must be greater than 0 RWF';
  } else if (!Number.isInteger(input.pricePerKgRwf)) {
    errors.pricePerKgRwf = 'Price must be a whole number in RWF';
  }

  if (!input.pickupDistrict || input.pickupDistrict.trim().length === 0) {
    errors.pickupDistrict = 'District is required';
  }

  if (!input.pickupSector || input.pickupSector.trim().length === 0) {
    errors.pickupSector = 'Sector is required';
  }

  // BR-01: Warehouse / aggregation facility readiness
  if (!input.pickupLocationDetails || input.pickupLocationDetails.trim().length === 0) {
    errors.pickupLocationDetails = 'Warehouse, collection center, or storage facility details are required (BR-01, FR-LOT-01)';
  }

  if (!input.photos || input.photos.length === 0) {
    errors.photos = 'At least one photo of the harvested lot is required (FR-LOT-01)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
