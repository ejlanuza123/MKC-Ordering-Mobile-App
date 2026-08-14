import { detectNearestBarangay, formatAddress, PUERTO_PRINCESA_BARANGAYS } from '../../utils/location';

describe('Puerto Princesa Location Utilities (MKC Foods)', () => {
  it('contains essential Puerto Princesa barangays', () => {
    const names = PUERTO_PRINCESA_BARANGAYS.map(b => b.name);
    expect(names).toContain('San Pedro');
    expect(names).toContain('San Jose');
    expect(names).toContain('Tiniguiban');
    expect(names).toContain('San Miguel');
    expect(names).toContain('Santa Monica');
    expect(names).toContain('Bancao-Bancao');
  });

  it('detects barangay by text alias', () => {
    expect(detectNearestBarangay(null, null, 'National Highway near San Pedro')).toBe('San Pedro');
    expect(detectNearestBarangay(null, null, 'Palawan State University Tiniguiban')).toBe('Tiniguiban');
    expect(detectNearestBarangay(null, null, 'New Market San Jose Terminal')).toBe('San Jose');
  });

  it('detects barangay by spatial proximity coordinates', () => {
    expect(detectNearestBarangay(9.7535, 118.7479)).toBe('San Pedro');
    expect(detectNearestBarangay(9.7460, 118.7520)).toBe('San Miguel');
    expect(detectNearestBarangay(9.7450, 118.7410)).toBe('Maningning');
    expect(detectNearestBarangay(9.7890, 118.7360)).toBe('Santa Monica');
  });

  it('correctly identifies Barangay Maningning even when street is Rizal Ave', () => {
    expect(detectNearestBarangay(9.7450, 118.7410, 'Rizal Avenue')).toBe('Maningning');
    expect(detectNearestBarangay(9.7460, 118.7520, 'Rizal Avenue')).toBe('San Miguel');
  });

  it('formats clean Philippine address with verified Barangay', () => {
    const mockAddr = {
      name: 'MKC Kitchen',
      street: 'BM Road',
      district: 'San Manuel',
      postalCode: '5300'
    };

    const formatted = formatAddress(mockAddr, 9.7610, 118.7620);
    expect(formatted).toContain('MKC Kitchen');
    expect(formatted).toContain('BM Road');
    expect(formatted).toContain('Brgy. San Manuel');
    expect(formatted).toContain('Puerto Princesa City');
    expect(formatted).toContain('Palawan');
  });
});
