import React, { useState, useEffect } from 'react';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { languages } from 'monaco-editor';

import { ContextProvider } from '@abgov/jsonforms-components';
import { Disposition, FormDefinition } from '@store/form/model';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { ClientRoleTable } from '@components/RoleTable';
import { SaveFormModal } from '@components/saveModal';
import { useDebounce } from '@lib/useDebounce';

import {
  TextLoadingIndicator,
  FlexRow,
  NameDescriptionDataSchema,
  FormPreviewContainer,
  EditorPadding,
  FinalButtonPadding,
  FormEditorTitle,
  FormEditor,
  ScrollPane,
  MonacoDivTabBody,
  RightAlign,
  PRE,
  FakeButton,
  SubmissionRecordsBox,
  FormPreviewScrollPane,
} from '../styled-components';
import { ConfigServiceRole } from '@store/access/models';
import { getFormDefinitions } from '@store/form/action';
import { updateFormDefinition } from '@store/form/action';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { defaultFormDefinition } from '@store/form/model';
import { FormConfigDefinition } from './formConfigDefinition';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoAButtonGroup,
  GoAButton,
  GoAFormItem,
  GoACheckbox,
  GoADropdownItem,
  GoADropdown,
  GoACircularProgress,
} from '@abgov/react-components-new';
import useWindowDimensions from '@lib/useWindowDimensions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { Tab, Tabs } from '@components/Tabs';
import { PageIndicator } from '@components/Indicator';
import { isValidJSONSchemaCheck, ajv } from '@lib/validation/checkInput';
import DataTable from '@components/DataTable';
import { DispositionItems } from './dispositionItems';
import { DeleteModal } from '@components/DeleteModal';
import { AddEditDispositionModal } from './addEditDispositionModal';

import { InfoCircleWithInlineHelp } from './infoCircleWithInlineHelp';

import { RowFlex, QueueTaskDropdown } from './style-components';
import { getTaskQueues } from '@store/task/action';
import {
  UploadFileService,
  DownloadFileService,
  DeleteFileService,
  FetchFileTypeService,
  ClearNewFileList,
} from '@store/file/actions';
import { convertDataSchemaToSuggestion, formatEditorSuggestions } from '@lib/autoComplete';
import { JSONFormPreviewer } from './JsonFormPreviewer';
import { hasSchemaErrors, parseDataSchema, parseUiSchema } from './schemaUtils';
import { CustomLoader } from '@components/CustomLoader';

const isFormUpdated = (prev: FormDefinition, next: FormDefinition): boolean => {
  const tempPrev = parseUiSchema<FormDefinition>(JSON.stringify(prev)).get();
  const tempNext = parseUiSchema<FormDefinition>(JSON.stringify(next)).get();
  const isUpdated =
    JSON.stringify(tempPrev?.applicantRoles) !== JSON.stringify(tempNext?.applicantRoles) ||
    JSON.stringify(tempPrev?.assessorRoles) !== JSON.stringify(tempNext?.assessorRoles) ||
    JSON.stringify(tempPrev?.clerkRoles) !== JSON.stringify(tempNext?.clerkRoles) ||
    JSON.stringify(tempPrev?.dataSchema) !== JSON.stringify(tempNext?.dataSchema) ||
    JSON.stringify(tempPrev?.dispositionStates) !== JSON.stringify(tempNext?.dispositionStates) ||
    JSON.stringify(tempPrev?.uiSchema) !== JSON.stringify(tempNext?.uiSchema) ||
    JSON.stringify(tempPrev?.submissionRecords) !== JSON.stringify(tempNext?.submissionRecords) ||
    JSON.stringify(tempPrev?.queueTaskToProcess) !== JSON.stringify(tempNext?.queueTaskToProcess);

  return isUpdated;
};

export const formEditorJsonConfig = {
  'data-testid': 'templateForm-test-input',
  options: {
    selectOnLineNumbers: true,
    renderIndentGuides: true,
    colorDecorators: true,
  },
};

export const onSaveDispositionForModal = (
  isNewDisposition: boolean,
  currentDisposition: Disposition,
  definition: FormDefinition,
  selectedEditModalIndex: number | null
): [FormDefinition, number | null] => {
  if (isNewDisposition) {
    const currentDispositionStates = [...definition.dispositionStates] || [];
    if (currentDisposition) {
      currentDispositionStates.push(currentDisposition);
      definition.dispositionStates = currentDispositionStates;
    }
  } else {
    definition.dispositionStates[selectedEditModalIndex] = currentDisposition;
  }

  return [definition, null];
};

const NO_TASK_CREATED_OPTION = `No task created`;

export function AddEditFormDefinitionEditor(): JSX.Element {
  const fileList = useSelector((state: RootState) => {
    return state?.fileService.newFileList;
  });

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(FetchFileTypeService());
  }, [dispatch]);

  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);

  const uploadFile = (file: File, propertyId: string) => {
    const fileInfo = { file: file, type: fileTypes[0]?.id, propertyId: propertyId };
    dispatch(UploadFileService(fileInfo));
  };
  const downloadFile = (file) => {
    dispatch(DownloadFileService(file));
  };

  const JSONSchemaValidator = isValidJSONSchemaCheck('Data schema');
  const monaco = useMonaco();
  const [definition, setDefinition] = useState<FormDefinition>(defaultFormDefinition);
  const initialSchema = parseUiSchema<FormDefinition>(JSON.stringify(defaultFormDefinition)).get();
  const [initialDefinition, setInitialDefinition] = useState<FormDefinition>(initialSchema);

  const [tempUiSchema, setTempUiSchema] = useState<string>(JSON.stringify({}, null, 2));
  const [tempDataSchema, setTempDataSchema] = useState<string>(JSON.stringify(definition?.dataSchema || {}, null, 2));
  const [UiSchemaBounced, setTempUiSchemaBounced] = useState<string>(JSON.stringify({}, null, 2));
  const [dataSchemaBounced, setDataSchemaBounced] = useState<string>(JSON.stringify({}, null, 2));

  const [data, setData] = useState<unknown>();
  const [selectedDeleteDispositionIndex, setSelectedDeleteDispositionIndex] = useState<number>(null);
  const [selectedEditModalIndex, setSelectedEditModalIndex] = useState<number>(null);
  const [newDisposition, setNewDisposition] = useState<boolean>(false);
  const [customIndicator, setCustomIndicator] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [spinner, setSpinner] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });

  const debouncedRenderUISchema = useDebounce(tempUiSchema, 1000);
  const debouncedRenderDataSchema = useDebounce(tempDataSchema, 1000);

  const isEdit = !!id;

  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );

  const { height } = useWindowDimensions();
  const calcHeight = latestNotification && !latestNotification.disabled ? height - 50 : height;
  const EditorHeight = calcHeight - 570;
  const [editorErrors, setEditorErrors] = useState({
    uiSchema: null,
    dataSchemaJSON: null,
    dataSchemaJSONSchema: null,
  });

  const deleteFile = (file) => {
    dispatch(DeleteFileService(file?.id));
  };

  useEffect(() => {
    if (monaco) {
      const provider = monaco.languages.registerCompletionItemProvider('json', {
        triggerCharacters: ['/', '#', '"'],
        provideCompletionItems: (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          let suggestions = [];

          try {
            const parsedSchema = parseDataSchema(tempDataSchema);
            const dataSchemaSuggestion = convertDataSchemaToSuggestion(parsedSchema.get(), monaco);
            suggestions = formatEditorSuggestions(dataSchemaSuggestion);
          } catch (e) {
            console.debug(`Error in JSON editor autocompletion: ${e.message}`);
          }

          return {
            suggestions,
          } as languages.ProviderResult<languages.CompletionList>;
        },
      });
      return function cleanup() {
        provider.dispose();
      };
    }
  }, [monaco, tempDataSchema]);

  useEffect(() => {
    dispatch(FetchRealmRoles());

    dispatch(fetchKeycloakServiceRoles());
    dispatch(getFormDefinitions());
    dispatch(getTaskQueues());
  }, [dispatch]);

  const types = [
    { type: 'applicantRoles', name: 'Applicant roles' },
    { type: 'clerkRoles', name: 'Clerk roles' },
    { type: 'assessorRoles', name: 'Assessor roles' },
  ];

  const formDefinitions = useSelector((state: RootState) => state?.form?.definitions || []);

  const selectServiceKeycloakRoles = createSelector(
    (state: RootState) => state.serviceRoles,
    (serviceRoles) => {
      return serviceRoles?.keycloak || {};
    }
  );
  const queueTasks = useSelector((state: RootState) => {
    if (state.task && state.task.queues) {
      const values = Object.entries(state?.task?.queues).reduce((tempObj, [taskDefinitionId, taskDefinitionData]) => {
        tempObj[taskDefinitionId] = taskDefinitionData;
        return tempObj;
      }, {});
      return values;
    }
  });

  useEffect(() => {
    if (saveModal.closeEditor) {
      close();
    }
  }, [saveModal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id && formDefinitions[id]) {
      const tempFormDefinition = formDefinitions[id] as FormDefinition;
      if (hasSchemaErrors(tempFormDefinition.dataSchema) || hasSchemaErrors(tempFormDefinition?.uiSchema)) {
        return;
      }
      if (Object.keys(tempFormDefinition.uiSchema || {}).length > 0) {
        setTempUiSchema(JSON.stringify(tempFormDefinition.uiSchema, null, 2));
        setTempUiSchemaBounced(JSON.stringify(tempFormDefinition.uiSchema, null, 2));
      }
      if (Object.keys(tempFormDefinition.dataSchema || {}).length > 0) {
        setTempDataSchema(JSON.stringify(tempFormDefinition.dataSchema, null, 2));
        setDataSchemaBounced(JSON.stringify(tempFormDefinition.dataSchema, null, 2));
      }
      setInitialDefinition(parseUiSchema<FormDefinition>(JSON.stringify(formDefinitions[id])).get());
      setDefinition(formDefinitions[id]);
      setCustomIndicator(false);
    }
  }, [formDefinitions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      JSON.parse(tempUiSchema);
      setTempUiSchemaBounced(tempUiSchema);
      setError('');
      setCustomIndicator(false);
    } catch {
      setTempUiSchemaBounced('{}');
    }
  }, [debouncedRenderUISchema]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      JSON.parse(tempDataSchema);
      setDataSchemaBounced(tempDataSchema);
      setError('');
    } catch (e) {
      setDataSchemaBounced('{}');
    }
  }, [debouncedRenderDataSchema]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useNavigate();

  const close = () => {
    dispatch(ClearNewFileList());
    navigate('/admin/services/form?definitions=true');
  };

  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));
  //eslint-disable-next-line
  useEffect(() => {}, [fetchKeycloakRolesState]);

  const ClientRole = ({ roleNames, clientId }) => {
    const applicantRoles = types[0];
    const clerkRoles = types[1];

    return (
      <ClientRoleTable
        roles={roleNames}
        clientId={clientId}
        anonymousRead={definition.anonymousApply}
        roleSelectFunc={(roles, type) => {
          if (type === applicantRoles.name) {
            setDefinition({
              ...definition,
              applicantRoles: roles,
            });
          } else if (type === clerkRoles.name) {
            setDefinition({
              ...definition,
              clerkRoles: roles,
            });
          } else {
            setDefinition({
              ...definition,
              assessorRoles: roles,
            });
          }
        }}
        nameColumnWidth={40}
        service="FileType"
        checkedRoles={[
          { title: types[0].name, selectedRoles: definition[types[0].type] },
          { title: types[1].name, selectedRoles: definition[types[1].type] },
          { title: types[2].name, selectedRoles: definition[types[2].type] },
        ]}
      />
    );
  };

  const roles = useSelector((state: RootState) => state.tenant.realmRoles) || [];

  const roleNames = roles.map((role) => {
    return role.name;
  });

  const keycloakClientRoles = useSelector(selectServiceKeycloakRoles);
  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];

  const clientElements =
    Object.entries(keycloakClientRoles).length > 0 &&
    Object.entries(keycloakClientRoles)
      .filter(([clientId, config]) => {
        return (config as ConfigServiceRole).roles.length > 0;
      })
      .map(([clientId, config]) => {
        const roles = (config as ConfigServiceRole).roles;
        const roleNames = roles.map((role) => {
          return role.role;
        });
        return { roleNames: roleNames, clientId: clientId, currentElements: null };
      });
  elements = elements.concat(clientElements);

  const definitions = useSelector((state: RootState) => {
    return state?.form?.definitions;
  });
  const definitionIds = definitions ? Object.keys(definitions) : [];

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const [activeIndex] = useState<number>(0);

  useEffect(() => {
    if (spinner && Object.keys(definitions).length > 0) {
      if (validators['duplicate'].check(definition.id)) {
        setSpinner(false);
        return;
      }

      setSpinner(false);
    }
  }, [definitions]); // eslint-disable-line react-hooks/exhaustive-deps

  const openModalFunction = (disposition) => {
    const currentDispositions = definition.dispositionStates;
    const dispIndex = currentDispositions.findIndex((disp) => disp.id === disposition.id);
    setSelectedEditModalIndex(dispIndex);
  };

  const updateDispositionFunction = (dispositions) => {
    const tempDefinition = { ...definition };
    tempDefinition.dispositionStates = dispositions;

    setDefinition(parseUiSchema<FormDefinition>(JSON.stringify(tempDefinition)).get());
  };

  const openDeleteModalFunction = (disposition) => {
    const currentDispositions = definition.dispositionStates;
    const dispIndex = currentDispositions.findIndex((disp) => disp.id === disposition.id);
    setSelectedDeleteDispositionIndex(dispIndex);
  };

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(definitionIds, 'definition'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  const getQueueTaskToProcessValue = () => {
    let value = NO_TASK_CREATED_OPTION;

    if (definition.queueTaskToProcess) {
      const { queueNameSpace, queueName } = definition.queueTaskToProcess;
      if (queueNameSpace !== '' && queueName !== '') {
        value = `${queueNameSpace}:${queueName}`;
      } else {
        value = NO_TASK_CREATED_OPTION;
      }
    }

    return value;
  };

  const getDispositionForModal = () => {
    if (selectedEditModalIndex !== null) {
      return definition?.dispositionStates && definition.dispositionStates[selectedEditModalIndex];
    }
    return { id: '', name: '', description: '' } as Disposition;
  };

  return (
    <FormEditor>
      {spinner ? (
        <PageIndicator />
      ) : (
        <FlexRow>
          {customIndicator && <CustomLoader />}
          <NameDescriptionDataSchema>
            <FormEditorTitle>Form / Definition Editor</FormEditorTitle>
            <hr className="hr-resize" />
            {definition && <FormConfigDefinition definition={definition} />}

            <Tabs activeIndex={activeIndex} data-testid="form-editor-tabs">
              <Tab label="Data schema" data-testid="form-editor-data-schema-tab">
                <GoAFormItem
                  error={errors?.body ?? editorErrors?.dataSchemaJSON ?? editorErrors?.dataSchemaJSONSchema ?? null}
                  label=""
                >
                  <EditorPadding>
                    <MonacoEditor
                      data-testid="form-data-schema"
                      height={EditorHeight}
                      value={tempDataSchema}
                      onChange={(value) => {
                        const jsonSchemaValidResult = JSONSchemaValidator(value);
                        setTempDataSchema(value);

                        if (jsonSchemaValidResult === '') {
                          setEditorErrors({
                            ...editorErrors,
                            dataSchemaJSONSchema: null,
                          });
                        } else {
                          setEditorErrors({
                            ...editorErrors,
                            dataSchemaJSONSchema: jsonSchemaValidResult,
                          });
                        }
                      }}
                      onValidate={(makers) => {
                        if (makers.length === 0) {
                          setEditorErrors({
                            ...editorErrors,
                            dataSchemaJSON: null,
                          });
                          return;
                        }
                        setEditorErrors({
                          ...editorErrors,
                          dataSchemaJSON: `Invalid JSON: col ${makers[0]?.endColumn}, line: ${makers[0]?.endLineNumber}, ${makers[0]?.message}`,
                        });
                      }}
                      language="json"
                      options={{
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        tabSize: 2,
                        minimap: { enabled: false },
                      }}
                    />
                  </EditorPadding>
                </GoAFormItem>
              </Tab>
              <Tab label="UI schema" data-testid="form-editor-ui-schema-tab">
                <GoAFormItem error={errors?.body ?? editorErrors?.uiSchema ?? null} label="">
                  <EditorPadding>
                    <MonacoEditor
                      data-testid="form-ui-schema"
                      height={EditorHeight}
                      value={tempUiSchema}
                      {...formEditorJsonConfig}
                      onValidate={(makers) => {
                        if (makers.length === 0) {
                          setEditorErrors({
                            ...editorErrors,
                            uiSchema: null,
                          });
                          return;
                        }
                        setEditorErrors({
                          ...editorErrors,
                          uiSchema: `Invalid JSON: col ${makers[0]?.endColumn}, line: ${makers[0]?.endLineNumber}, ${makers[0]?.message}`,
                        });
                      }}
                      onChange={(value) => {
                        setTempUiSchema(value);
                      }}
                      language="json"
                      options={{
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        tabSize: 2,
                        minimap: { enabled: false },
                      }}
                    />
                  </EditorPadding>
                </GoAFormItem>
              </Tab>
              <Tab label="Roles" data-testid="form-roles-tab">
                <MonacoDivTabBody data-testid="roles-editor-body" style={{ height: EditorHeight - 5 }}>
                  <ScrollPane>
                    {elements.map((e, key) => {
                      return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
                    })}
                    {fetchKeycloakRolesState === ActionState.inProcess && (
                      <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
                    )}
                  </ScrollPane>
                </MonacoDivTabBody>
              </Tab>
              <Tab label="Submission configuration" data-testid="submission-configuration">
                <div style={{ height: EditorHeight + 7 }}>
                  <FlexRow>
                    <SubmissionRecordsBox>
                      <GoACheckbox
                        name="submission-records"
                        key="submission-records"
                        checked={definition.submissionRecords}
                        testId="submission-records"
                        onChange={() => {
                          const records = definition.submissionRecords ? false : true;
                          setDefinition({ ...definition, submissionRecords: records });
                        }}
                        text="  Create submission records on submit"
                      />
                    </SubmissionRecordsBox>
                    <InfoCircleWithInlineHelp
                      text={
                        definition.submissionRecords
                          ? 'Forms of this type will create submission records. This submission record can be used for processing of the application and to record an adjudication decision (disposition state).'
                          : 'Forms of this type will not create a submission record when submitted. Applications are responsible for managing how forms are processed after they are submitted.'
                      }
                    />
                  </FlexRow>

                  <div style={{ background: definition.submissionRecords ? 'white' : '#f1f1f1' }}>
                    <InfoCircleWithInlineHelp
                      initialLabelValue={definition.submissionRecords}
                      label="Task queue to process &nbsp;"
                      text={
                        getQueueTaskToProcessValue() === NO_TASK_CREATED_OPTION
                          ? ' No task will be created for processing of the submissions. Applications are responsible for management of how submissions are worked on by users.'
                          : 'A task will be created in queue “{queue namespace + name}” for submissions of the form. This allows program staff to work on the submissions from the task management application using this queue.'
                      }
                    />

                    <QueueTaskDropdown>
                      {queueTasks && Object.keys(queueTasks).length > 0 && (
                        <GoADropdown
                          data-test-id="form-submission-select-queue-task-dropdown"
                          name="queueTasks"
                          disabled={!definition.submissionRecords}
                          value={[getQueueTaskToProcessValue()]}
                          relative={true}
                          onChange={(name, queueTask: string) => {
                            const separatedQueueTask = queueTask.split(':');
                            if (separatedQueueTask.length > 1) {
                              setDefinition({
                                ...definition,
                                queueTaskToProcess: {
                                  queueNameSpace: separatedQueueTask[0],
                                  queueName: separatedQueueTask[1],
                                },
                              });
                            } else {
                              setDefinition({
                                ...definition,
                                queueTaskToProcess: {
                                  queueNameSpace: '',
                                  queueName: '',
                                },
                              });
                            }
                          }}
                        >
                          <GoADropdownItem
                            data-testId={`task-Queue-ToCreate-DropDown`}
                            key={`No-Task-Created`}
                            value={NO_TASK_CREATED_OPTION}
                            label={NO_TASK_CREATED_OPTION}
                          />
                          {queueTasks &&
                            Object.keys(queueTasks)
                              .sort()
                              .map((item) => (
                                <GoADropdownItem data-testId={item} key={item} value={item} label={item} />
                              ))}
                        </GoADropdown>
                      )}
                    </QueueTaskDropdown>
                    <RowFlex>
                      <h3>Disposition states</h3>
                      <div>
                        {definition.submissionRecords ? (
                          <InfoCircleWithInlineHelp
                            text="Disposition states represent possible decisions applied to submissions by program staff. For example, an adjudicator may find that a submission is incomplete and records an Incomplete state with rationale of what information is missing."
                            width={450}
                          />
                        ) : (
                          <FakeButton />
                        )}
                      </div>
                      <RightAlign>
                        {definition.submissionRecords ? (
                          <GoAButton
                            type="secondary"
                            testId="Add state"
                            disabled={!definition.submissionRecords}
                            onClick={() => {
                              setNewDisposition(true);
                              setSelectedEditModalIndex(null);
                            }}
                          >
                            Add state
                          </GoAButton>
                        ) : (
                          <FakeButton />
                        )}
                      </RightAlign>
                    </RowFlex>

                    <div
                      style={{
                        overflowY: 'auto',
                        height: EditorHeight - 228,
                        zIndex: 0,
                      }}
                    >
                      {definition.dispositionStates && definition.dispositionStates.length === 0 ? (
                        'No disposition states'
                      ) : (
                        <DataTable>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Description</th>
                              <th>Order</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {definition && (
                              <DispositionItems
                                openModalFunction={openModalFunction}
                                updateDispositions={updateDispositionFunction}
                                openDeleteModalFunction={openDeleteModalFunction}
                                dispositions={definition.dispositionStates}
                                submissionRecords={definition.submissionRecords}
                              />
                            )}
                          </tbody>
                        </DataTable>
                      )}
                    </div>
                  </div>
                </div>
              </Tab>
            </Tabs>

            <hr className="hr-resize-bottom" />
            <FinalButtonPadding>
              <GoAButtonGroup alignment="start">
                <GoAButton
                  type="primary"
                  testId="definition-form-save"
                  disabled={
                    !isFormUpdated(initialDefinition, {
                      ...definition,
                      uiSchema: parseUiSchema<Record<string, unknown>>(UiSchemaBounced).get(),
                      dataSchema: parseDataSchema<Record<string, unknown>>(dataSchemaBounced).get(),
                    }) ||
                    !definition.name ||
                    validators.haveErrors() ||
                    editorErrors.dataSchemaJSON !== null ||
                    editorErrors.dataSchemaJSONSchema !== null ||
                    editorErrors.uiSchema !== null
                  }
                  onClick={async () => {
                    if (indicator.show === true) {
                      setSpinner(true);
                    } else {
                      if (!isEdit) {
                        const validations = {
                          duplicate: definition.name,
                        };
                        if (!validators.checkAll(validations)) {
                          return;
                        }
                      }
                      setCustomIndicator(true);
                      await dispatch(
                        updateFormDefinition({
                          ...definition,
                          uiSchema: parseUiSchema<Record<string, unknown>>(UiSchemaBounced).get(),
                          dataSchema: parseDataSchema<Record<string, unknown>>(dataSchemaBounced).get(),
                        })
                      );
                    }
                  }}
                >
                  Save
                </GoAButton>
                <GoAButton
                  testId="form-editor-cancel"
                  type="secondary"
                  onClick={() => {
                    if (
                      isFormUpdated(initialDefinition, {
                        ...definition,
                        uiSchema: parseUiSchema<Record<string, unknown>>(UiSchemaBounced).get(),
                        dataSchema: parseDataSchema<Record<string, unknown>>(dataSchemaBounced).get(),
                      })
                    ) {
                      setSaveModal({ visible: true, closeEditor: false });
                    } else {
                      validators.clear();
                      close();
                    }
                  }}
                >
                  Back
                </GoAButton>
              </GoAButtonGroup>
            </FinalButtonPadding>
          </NameDescriptionDataSchema>

          <FormPreviewContainer>
            <Tabs activeIndex={0} data-testid="preview-tabs">
              <Tab label="Preview" data-testid="preview-view-tab">
                <div style={{ paddingTop: '2rem' }}>
                  <FormPreviewScrollPane>
                    <ContextProvider
                      fileManagement={{
                        fileList: fileList,
                        uploadFile: uploadFile,
                        downloadFile: downloadFile,
                        deleteFile: deleteFile,
                      }}
                    >
                      <GoAFormItem error={error} label="">
                        <JSONFormPreviewer
                          uischema={tempUiSchema}
                          schema={tempDataSchema}
                          onChange={({ data }) => {
                            setData(data);
                          }}
                          data={data}
                        />
                      </GoAFormItem>
                    </ContextProvider>
                  </FormPreviewScrollPane>
                </div>
              </Tab>
              <Tab label="Data" data-testid="data-view">
                {data && <PRE>{JSON.stringify(data, null, 2)}</PRE>}
              </Tab>
            </Tabs>
          </FormPreviewContainer>
        </FlexRow>
      )}
      <SaveFormModal
        open={saveModal.visible}
        onDontSave={() => {
          setSaveModal({ visible: false, closeEditor: true });
        }}
        onSave={() => {
          if (!isEdit) {
            const validations = {
              duplicate: definition.name,
            };
            if (!validators.checkAll(validations)) {
              return;
            }
          }
          setSpinner(true);
          dispatch(updateFormDefinition(definition));
          setSaveModal({ visible: false, closeEditor: true });
        }}
        saveDisable={
          !isFormUpdated(initialDefinition, {
            ...definition,
            uiSchema: parseUiSchema<Record<string, unknown>>(UiSchemaBounced).get(),
            dataSchema: parseDataSchema<Record<string, unknown>>(dataSchemaBounced).get(),
          })
        }
        onCancel={() => {
          setSaveModal({ visible: false, closeEditor: false });
        }}
      />
      <DeleteModal
        title="Delete disposition state"
        isOpen={selectedDeleteDispositionIndex !== null}
        onCancel={() => {
          setSelectedDeleteDispositionIndex(null);
        }}
        content={
          <div>
            <div>
              Are you sure you wish to delete{' '}
              {`${
                definition?.dispositionStates &&
                JSON.stringify(definition.dispositionStates[selectedDeleteDispositionIndex]?.name)
              }`}
            </div>
          </div>
        }
        onDelete={() => {
          const tempDefinition = { ...definition };
          delete tempDefinition.dispositionStates[selectedDeleteDispositionIndex];
          tempDefinition.dispositionStates = tempDefinition.dispositionStates.filter((s) => s !== null);
          setDefinition(tempDefinition);
          setSelectedDeleteDispositionIndex(null);
        }}
      />

      <AddEditDispositionModal
        open={selectedEditModalIndex !== null || newDisposition}
        isEdit={selectedEditModalIndex !== null}
        existingDispositions={definition?.dispositionStates}
        initialValue={getDispositionForModal()}
        onSave={(currentDispositions) => {
          const [updatedDefinition, index] = onSaveDispositionForModal(
            newDisposition,
            currentDispositions,
            definition,
            selectedEditModalIndex
          );
          setDefinition(updatedDefinition);
          setSelectedDeleteDispositionIndex(index);
        }}
        onClose={() => {
          setNewDisposition(false);
          setSelectedEditModalIndex(null);
        }}
      />
    </FormEditor>
  );
}
