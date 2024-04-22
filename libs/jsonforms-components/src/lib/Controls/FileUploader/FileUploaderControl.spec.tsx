import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextProviderFactory } from '../../Context/index';
import { ControlElement, UISchemaElement } from '@jsonforms/core';
import { GoACells, GoARenderers } from '../../../index';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv8';

/**
 * VERY IMPORTANT:  Rendering <JsonForms ... /> does not work unless the following
 * is included.
 */
window.matchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: true,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
});

const ajv = new Ajv({ allErrors: true, verbose: true, validateFormats: false });

const fileUploaderUiSchema: ControlElement = {
  type: 'Control',
  scope: '#/properties/supportingDoc',
  label: 'Uploader',
};
const dataSchema = {
  type: 'object',
  properties: {
    supportingDoc: {
      type: 'string',
      format: 'file-urn',
    },
  },
};

const mockUpload = jest.fn();
const mockDownload = jest.fn();
const mockDelete = jest.fn();
const fileList = { supportingDoc: { urn: 'urn:1q3e131', filename: 'bob.pdf' } };
const ContextProvider = ContextProviderFactory();

const getForm = (schema: object, uiSchema: UISchemaElement, data: object = {}) => {
  return (
    <ContextProvider
      fileManagement={{
        fileList: fileList,
        uploadFile: mockUpload,
        downloadFile: mockDownload,
        deleteFile: mockDelete,
      }}
    >
      <JsonForms data={data} schema={schema} uischema={uiSchema} ajv={ajv} renderers={GoARenderers} cells={GoACells} />
    </ContextProvider>
  );
};

describe('FileUploaderControl tests', () => {
  it('can render file upload control', () => {
    const { container } = render(getForm(dataSchema, fileUploaderUiSchema));
    const element = container.querySelector('goa-file-upload-input');
    expect(element).toBeInTheDocument();
  });

  it('can upload a file', async () => {
    jest.useFakeTimers();
    const renderer = render(getForm(dataSchema, fileUploaderUiSchema));
    // This act() wrapper is needed for the jest.runAllTimers() call.
    await act(async () => {
      const uploadBtn = await renderer.container.querySelector('div > :scope goa-file-upload-input');
      expect(uploadBtn).toBeInTheDocument();
      fireEvent(uploadBtn!, new CustomEvent('_selectFile', { detail: {} }));
      await jest.runAllTimers();
      expect(mockUpload).toBeCalledTimes(1);
      const file = await renderer.findByText('bob.pdf');
      expect(file).toBeInTheDocument();
    });
  });

  it('can download a file', () => {
    const renderer = render(getForm(dataSchema, fileUploaderUiSchema));
    const downloadBtn = renderer.getByTestId('download-icon');
    expect(downloadBtn).toBeInTheDocument();
    fireEvent(downloadBtn!, new CustomEvent('_click'));
    expect(mockDownload).toBeCalledTimes(1);
  });

  it('can delete an uploaded file', () => {
    const renderer = render(getForm(dataSchema, fileUploaderUiSchema));
    const uploadBtn = renderer.container.querySelector('div > :scope goa-file-upload-input');
    expect(uploadBtn).toBeInTheDocument();
    fireEvent(uploadBtn!, new CustomEvent('_selectFile', { detail: {} }));
    const deleteBtn = renderer.container.querySelector('div > :scope goa-icon-button[icon="trash"]');
    expect(deleteBtn).toBeInTheDocument();
    fireEvent(deleteBtn!, new CustomEvent('_click'));
    const modal = renderer.getByTestId('delete-confirmation');
    expect(modal!.getAttribute('open')).toBe('true');
    const deleteConfirm = renderer.getByTestId('delete-confirm');
    expect(deleteConfirm).toBeInTheDocument();
    fireEvent(deleteConfirm!, new CustomEvent('_click'));
    fireEvent.click(deleteConfirm!);
    expect(mockDelete).toBeCalledTimes(1);
  });
});
