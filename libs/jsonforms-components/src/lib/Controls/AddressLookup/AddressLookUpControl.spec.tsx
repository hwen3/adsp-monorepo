import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddressLookUpControl } from './AddressLookUpControl';
import { fetchAddressSuggestions } from './utils';
import { JsonFormContext } from '../../Context';
import { Suggestion } from './types';

jest.mock('./utils', () => ({
  fetchAddressSuggestions: jest.fn(),
  filterAlbertaAddresses: jest.fn(),
  mapSuggestionToAddress: jest.fn(),
}));
const mockHandleChange = jest.fn();
const formUrl = 'http://mock-form-url.com';
const mockFormContext = {
  formUrl,
};
describe('AddressLookUpControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (overrides = {}) => {
    const defaultProps = {
      data: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'CAN',
      },
      path: 'address',
      schema: {
        properties: {
          subdivisionCode: {
            const: 'AB',
          },
        },
      },
      uischema: {
        options: {
          autocomplete: true,
        },
        label: 'Address Lookup',
      },
      handleChange: mockHandleChange,
    };

    const props = { ...defaultProps, ...overrides };

    return render(
      <JsonFormContext.Provider value={mockFormContext}>
        <AddressLookUpControl {...props} />
      </JsonFormContext.Provider>
    );
  };

  const mockSuggestions: Suggestion[] = [
    {
      Id: '1',
      Text: '123 Main St',
      Highlight: '',
      Cursor: 0,
      Description: 'Calgary, AB, T1X 1A1',
      Next: '',
    },
    {
      Id: '2',
      Text: '456 Elm St',
      Highlight: '',
      Cursor: 0,
      Description: 'Edmonton, AB, T6H 3Y9',
      Next: '',
    },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the input fields with empty values', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Start typing the first line of your address');
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('renders inputs and suggestions', async () => {
    (fetchAddressSuggestions as jest.Mock).mockResolvedValueOnce(mockSuggestions);

    renderComponent();
    const inputField = screen.getByTestId('address-form-address1');

    fireEvent.change(inputField, { target: { value: '123' } });

    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { name: 'addressLine1', value: '123' },
      })
    );
    expect((inputField as HTMLInputElement).value).toBe('123');
  });

  it('displays no suggestions for less than 3 characters', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Start typing the first line of your address');
    fireEvent.change(input, { target: { value: 'Ma' } });

    await waitFor(() => expect(screen.queryByRole('listitem')).toBeNull());
  });
});
