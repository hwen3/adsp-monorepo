import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  TemplateEditorContainerPdf,
  EditTemplateActions,
  MonacoDivBody,
  PdfEditorLabelWrapper,
  PdfEditActionLayout,
  PdfEditActions,
  GeneratorStyling,
  PDFTitle,
  ButtonRight,
} from '../../styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { PdfTemplate } from '@store/pdf/model';
import { languages } from 'monaco-editor';
import { buildSuggestions, triggerInScope } from '@lib/autoComplete';
import { GoAButton } from '@abgov/react-components-new';
import { Tab, Tabs } from '@components/Tabs';
import { SaveFormModal } from '@components/saveModal';
import { PDFConfigForm } from './PDFConfigForm';
import { getSuggestion } from '../utils/suggestion';
import { bodyEditorConfig } from './config';
import GeneratedPdfList from '../generatedPdfList';
import { LogoutModal } from '@components/LogoutModal';
import { deletePdfFilesService } from '@store/pdf/action';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { DeleteModal } from '@components/DeleteModal';

interface TemplateEditorProps {
  modelOpen: boolean;
  onBodyChange: (value: string) => void;
  onHeaderChange: (value: string) => void;
  onCssChange: (value: string) => void;
  onFooterChange: (value: string) => void;
  template: PdfTemplate;
  saveCurrentTemplate?: (value: string) => void;
  // eslint-disable-next-line
  errors?: any;
  // eslint-disable-next-line
  cancel: () => void;
}

const isPDFUpdated = (prev: PdfTemplate, next: PdfTemplate): boolean => {
  console.log(JSON.stringify(prev?.additionalStyles) + '<prev.additionalStyles');
  console.log(JSON.stringify(next?.additionalStyles) + '<next.additionalStyles');
  return (
    prev?.template !== next?.template ||
    prev?.header !== next?.header ||
    prev?.footer !== next?.footer ||
    prev?.additionalStyles !== next?.additionalStyles ||
    prev?.name !== next?.name ||
    prev?.description !== next?.description ||
    prev?.variables !== next?.variables
  );
};

export const TemplateEditor: FunctionComponent<TemplateEditorProps> = ({
  modelOpen,
  onBodyChange,
  onHeaderChange,
  onFooterChange,
  onCssChange,
  template,
  saveCurrentTemplate,
  errors,
  cancel,
}) => {
  const monaco = useMonaco();
  const [saveModal, setSaveModal] = useState(false);

  const [tmpTemplate, setTmpTemplate] = useState(JSON.parse(JSON.stringify(template || '')));
  const suggestion = template ? getSuggestion() : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    setTmpTemplate(template);
  }, [template]);

  useEffect(() => {
    if (monaco) {
      const provider = monaco.languages.registerCompletionItemProvider('handlebars', {
        triggerCharacters: ['{{', '.'],
        provideCompletionItems: (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          const suggestions = triggerInScope(textUntilPosition, position.lineNumber)
            ? buildSuggestions(monaco, suggestion, model, position)
            : [];

          return {
            suggestions,
          } as languages.ProviderResult<languages.CompletionList>;
        },
      });
      return function cleanup() {
        provider.dispose();
      };
    }
  }, [monaco, suggestion]);

  const onVariableChange = (value) => {
    setTmpTemplate({ ...tmpTemplate, variables: value });
  };

  useEffect(() => {
    if (modelOpen) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [modelOpen]);

  const resetSavedAction = () => {
    onBodyChange(template.template);
    onHeaderChange(template.header);
    onFooterChange(template.footer);
    onCssChange(template.additionalStyles);
    onVariableChange(template?.variables);
  };

  const dispatch = useDispatch();

  const monacoHeight = `calc(100vh - 585px${notifications.length > 0 ? ' - 80px' : ''})`;

  return (
    <TemplateEditorContainerPdf>
      <LogoutModal />
      <PDFTitle>PDF / Template Editor</PDFTitle>
      <hr className="hr-resize" />
      {template && <PDFConfigForm template={template} />}

      <GoAForm>
        <GoAFormItem>
          <Tabs style={{ minWidth: '4.5em' }} activeIndex={activeIndex}>
            <Tab testId={`pdf-edit-header`} label={<PdfEditorLabelWrapper>Header</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.header ?? ''}>
                <MonacoDivBody style={{ height: monacoHeight }}>
                  {template && (
                    <MonacoEditor
                      language={'handlebars'}
                      defaultValue={template?.header}
                      onChange={(value) => {
                        //template.header = value;
                        setTmpTemplate({ ...tmpTemplate, header: value });
                      }}
                      {...bodyEditorConfig}
                    />
                  )}
                </MonacoDivBody>
              </GoAFormItem>
            </Tab>
            <Tab testId={`pdf-edit-body`} label={<PdfEditorLabelWrapper>Body</PdfEditorLabelWrapper>}>
              <>
                <GoAFormItem error={errors?.body ?? null}>
                  <MonacoDivBody style={{ height: monacoHeight }}>
                    <MonacoEditor
                      language={'handlebars'}
                      defaultValue={template?.template}
                      onChange={(value) => {
                        //template.template = value;
                        setTmpTemplate({ ...tmpTemplate, template: value });
                      }}
                      {...bodyEditorConfig}
                    />
                  </MonacoDivBody>
                </GoAFormItem>
              </>
            </Tab>
            <Tab testId={`pdf-edit-footer`} label={<PdfEditorLabelWrapper>Footer</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.footer ?? ''}>
                <MonacoDivBody style={{ height: monacoHeight }}>
                  <MonacoEditor
                    language={'handlebars'}
                    defaultValue={template?.footer}
                    onChange={(value) => {
                      // template.footer = value;
                      setTmpTemplate({ ...tmpTemplate, footer: value });
                    }}
                    {...bodyEditorConfig}
                  />
                </MonacoDivBody>
              </GoAFormItem>
            </Tab>
            <Tab testId={`pdf-edit-css`} label={<PdfEditorLabelWrapper>CSS</PdfEditorLabelWrapper>}>
              <>
                <GoAFormItem error={errors?.body ?? null}>
                  <MonacoDivBody style={{ height: monacoHeight }}>
                    <MonacoEditor
                      language={'handlebars'}
                      defaultValue={template?.additionalStyles}
                      onChange={(value) => {
                        // template.additionalStyles = value;
                        setTmpTemplate({ ...tmpTemplate, additionalStyles: value });
                      }}
                      {...bodyEditorConfig}
                    />
                  </MonacoDivBody>
                </GoAFormItem>
              </>
            </Tab>
            <Tab testId={`pdf-test-generator`} label={<PdfEditorLabelWrapper>Test data</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.body ?? null}>
                <MonacoDivBody style={{ height: monacoHeight }}>
                  <MonacoEditor
                    data-testid="form-schema"
                    value={template?.variables}
                    onChange={(value) => {
                      //template.variables = value;
                      setTmpTemplate({ ...tmpTemplate, variables: value });
                    }}
                    language="json"
                    {...bodyEditorConfig}
                  />
                </MonacoDivBody>
              </GoAFormItem>
            </Tab>
            <Tab testId={`pdf-test-history`} label={<PdfEditorLabelWrapper>File history</PdfEditorLabelWrapper>}>
              <>
                <GeneratorStyling>
                  <ButtonRight>
                    <GoAButton
                      type="secondary"
                      data-testid="form-save"
                      size="compact"
                      onClick={() => {
                        setShowDeleteConfirmation(true);
                      }}
                    >
                      Delete all files
                    </GoAButton>
                  </ButtonRight>
                  <section>{template?.id && <GeneratedPdfList templateId={template.id} />}</section>
                </GeneratorStyling>
              </>
            </Tab>
          </Tabs>
          <hr className="hr-resize-bottom" />
          <EditTemplateActions>
            <PdfEditActionLayout>
              <PdfEditActions>
                <>
                  <GoAButton
                    disabled={!isPDFUpdated(tmpTemplate, template)}
                    onClick={() => saveCurrentTemplate()}
                    type="primary"
                    data-testid="template-form-save"
                  >
                    Save
                  </GoAButton>
                  <GoAButton
                    onClick={() => {
                      if (isPDFUpdated(tmpTemplate, template)) {
                        setSaveModal(true);
                      } else {
                        cancel();
                      }
                    }}
                    data-testid="template-form-close"
                    type="tertiary"
                  >
                    Back
                  </GoAButton>
                </>
              </PdfEditActions>
            </PdfEditActionLayout>
          </EditTemplateActions>
        </GoAFormItem>
      </GoAForm>
      {/* Delete confirmation */}
      {showDeleteConfirmation && (
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete PDF file"
          content={<div>Are you sure you wish to delete all files</div>}
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(deletePdfFilesService(template.id));
          }}
        />
      )}
      <SaveFormModal
        open={saveModal}
        onDontSave={() => {
          setSaveModal(false);
          resetSavedAction();
          cancel();
        }}
        onSave={() => {
          saveCurrentTemplate(tmpTemplate);
          setSaveModal(false);
          cancel();
        }}
        saveDisable={false}
        onCancel={() => {
          setSaveModal(false);
        }}
      />
    </TemplateEditorContainerPdf>
  );
};
