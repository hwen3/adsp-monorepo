import axios from 'axios';
import { Address, Suggestion } from './types';

export const fetchAddressSuggestions = async (
  formUrl: string,
  searchTerm: string,
  isAlbertaAddress?: boolean
): Promise<Suggestion[]> => {
  const params = {
    country: 'CAN',
    languagePreference: 'en',
    lastId: '',
    maxSuggestions: isAlbertaAddress ? '50' : '10',
    searchTerm: searchTerm,
  };

  try {
    const response = await axios.get(formUrl, { params });
    return response.data.Items || [];
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return [];
  }
};
export const filterAlbertaAddresses = (suggestions: Suggestion[]): Suggestion[] => {
  return suggestions.filter((suggestion) => suggestion.Description.includes('AB'));
};

export const mapSuggestionToAddress = (suggestion: Suggestion): Address => {
  let addressLine1, addressLine2;
  const suiteMatch = suggestion.Text.match(/(Suite|Apt|Unit|#)+/i);
  const textParts = suggestion.Text.split(' ');
  if (suiteMatch) {
    addressLine1 = suggestion.Text.replace(textParts[0], '').trim();
    addressLine2 = textParts[0].trim();
  } else {
    addressLine2 = '';
    addressLine1 = suggestion.Text.trim();
  }

  const descriptionParts = suggestion.Description.split(',');
  const city = descriptionParts[0].trim();
  const provinceAndPostalCode = descriptionParts[1].trim().split(' ');
  const province = provinceAndPostalCode[0];
  const postalCode = descriptionParts[2].trim();

  return {
    addressLine1,
    addressLine2,
    city,
    province,
    postalCode,
    country: 'CAN',
  };
};
