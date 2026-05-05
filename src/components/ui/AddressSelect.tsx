import React, { useState, useMemo } from 'react';
import { CustomSelect } from './CustomSelect';
import type { SelectOption } from './CustomSelect';
import cityData from '../../assets/ctiy.json';

interface AddressSelectProps {
  city: string;
  ward: string;
  onCityChange: (city: string) => void;
  onWardChange: (ward: string) => void;
}

export const AddressSelect: React.FC<AddressSelectProps> = ({ city, ward, onCityChange, onWardChange }) => {
  const cityOptions: SelectOption[] = useMemo(() => {
    return cityData.cities.map(c => {
      // Clean up the bracketed names like "[Thành phố Hà Nội]"
      const cleanName = c.name.replace(/\[|\]/g, '').split(' (')[0].trim();
      return { value: cleanName, label: cleanName };
    });
  }, []);

  const wardOptions: SelectOption[] = useMemo(() => {
    if (!city) return [];
    // The JSON uses the cleaned city name or similar to match?
    // Let's filter wards by checking if ward.city includes or matches the city string
    const wards = cityData.wards.filter(w => w.city.includes(city) || city.includes(w.city));
    // Since wards in this JSON represent districts/wards (wnew), we map them out
    return wards.map(w => ({ value: w.wnew, label: w.wnew }));
  }, [city]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
      <div>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '4px', display: 'block' }}>Tỉnh / Thành phố</label>
        <CustomSelect 
          options={cityOptions}
          value={city}
          onChange={(val) => { onCityChange(val as string); onWardChange(''); }}
          placeholder="Chọn tỉnh/thành..."
          searchable
        />
      </div>
      <div>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '4px', display: 'block' }}>Quận / Huyện</label>
        <CustomSelect 
          options={wardOptions}
          value={ward}
          onChange={(val) => onWardChange(val as string)}
          placeholder={city ? "Chọn quận/huyện..." : "Vui lòng chọn tỉnh trước"}
          searchable
        />
      </div>
    </div>
  );
};
