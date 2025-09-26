'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';

// Same StableInput component as in the profile page
const StableInput = React.memo(({ 
  label, 
  value, 
  onChange, 
  onBlur,
  type = 'text', 
  placeholder,
  required = false,
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`
            block w-full rounded-lg border px-3 py-2 text-sm
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            placeholder-gray-400 focus:outline-none focus:ring-1
            transition-colors duration-200
          `.trim()}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

StableInput.displayName = 'StableInput';

export default function FocusTestPage() {
  const [formData, setFormData] = useState({
    mobile: '',
    emergencyContact: '',
    address: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors[field]) {
        delete newErrors[field];
      }
      return newErrors;
    });
  }, []);

  const handleFieldBlur = useCallback((field: string) => {
    const value = formData[field as keyof typeof formData];
    if (field === 'mobile' && value && !/^\d{10}$/.test(value)) {
      setErrors(prev => ({ ...prev, [field]: 'Mobile must be 10 digits' }));
    }
    if (field === 'emergencyContact' && value && value.length < 2) {
      setErrors(prev => ({ ...prev, [field]: 'Emergency contact must be at least 2 characters' }));
    }
  }, [formData]);

  const createInputChangeHandler = useCallback((field: string) => {
    return (value: string) => handleInputChange(field, value);
  }, [handleInputChange]);

  const createInputBlurHandler = useCallback((field: string) => {
    return () => handleFieldBlur(field);
  }, [handleFieldBlur]);

  const EditableField = React.memo(({ 
    label, 
    field, 
    type = 'text', 
    placeholder,
    required = false
  }: {
    label: string;
    field: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => {
    const fieldError = errors[field];
    const fieldValue = formData[field as keyof typeof formData] || '';
    
    const handleChange = useMemo(() => createInputChangeHandler(field), [field, createInputChangeHandler]);
    const handleBlur = useMemo(() => createInputBlurHandler(field), [field, createInputBlurHandler]);
    
    return (
      <StableInput
        label={label}
        value={fieldValue}
        onChange={handleChange}
        onBlur={handleBlur}
        type={type}
        placeholder={placeholder}
        required={required}
        error={fieldError}
      />
    );
  });

  EditableField.displayName = 'EditableField';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Focus Test - Profile Form</h1>
      <p className="mb-6 text-gray-600">
        Test the input field focus behavior. Type continuously in each field to verify that focus is maintained.
      </p>
      
      <div className="space-y-4">
        <EditableField
          label="Mobile Number"
          field="mobile"
          type="tel"
          placeholder="Enter 10-digit mobile number"
          required
        />
        
        <EditableField
          label="Emergency Contact Name"
          field="emergencyContact"
          placeholder="Enter emergency contact name"
          required
        />
        
        <EditableField
          label="Address"
          field="address"
          placeholder="Enter your address"
        />
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current Form Data:</h3>
        <pre className="text-sm">{JSON.stringify(formData, null, 2)}</pre>
        
        {Object.keys(errors).length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-4 mb-2">Current Errors:</h3>
            <pre className="text-sm text-red-600">{JSON.stringify(errors, null, 2)}</pre>
          </>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">Instructions:</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• Type continuously in each field without stopping</li>
          <li>• The focus should NOT be lost while typing</li>
          <li>• Validation should only trigger when you tab away (onBlur)</li>
          <li>• The form data should update in real-time below</li>
        </ul>
      </div>
    </div>
  );
}
