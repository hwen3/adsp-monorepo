import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import DataTable from '@components/DataTable';
import Chip from '@components/Chip';
import { GoAButton, GoADropdown, GoAOption, GoACallout } from '@abgov/react-components';
import { FileTypeItem } from '@store/file/models';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuid4 } from 'uuid';
import { RootState } from '@store/index';
import { Role } from '@store/tenant/models';
import Dialog, { DialogActions, DialogContent, DialogTitle } from '@components/Dialog';

import {
  DeleteFileTypeService,
  CreateFileTypeService,
  UpdateFileTypeService,
  FetchFileTypeHasFileService
} from '@store/file/actions';

const FileTypeTableContainer = styled.div`
  table {
    margin-top: 1rem;
    /* TODO: remove the margin-bottom when the dropdown component is fixed */
    margin-bottom: 6rem;
  }

  button {
    /* TODO: GoA button with a top margin, which is unexpected. After the fix, we can remove this line */
    margin-top: 0rem !important;
  }

  td.right {
    text-align: right !important;
  }

  th.right {
    text-align: right !important;
  }

  input {
    padding-left: 0.5rem;
    padding-top: 0rem !important;
    padding-bottom: 0rem !important;
    border-radius: 0.25rem;
    height: 2.5rem;
  }

  i {
    margin-top: 0.5rem !important;
  }

  td:nth-child(1) {
    width: 10%;
  }

  td:nth-child(2) {
    width: 15%;
  }
  td:nth-child(3) {
    width: 30%;
  }
  td:nth-child(4) {
    width: 30%;
  }
  td:nth-child(5) {
    width: 15%;
  }
  padding-bottom: 10rem;
  max-height: 40rem;
`;

const RolesCellContainer = styled.td`
  div + div {
    margin-left: 0.25rem;
  }
`;
interface FileTypeRowProps {
  name: string;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
  id: string;
  editable?: boolean;
  roles?: Role[];
  hasFile?: boolean;
  callback?: (updatedFileType: FileTypeItem) => void;
  cellType?: 'readRoles' | 'updateRoles';
  rowType?: 'update' | 'new';
}

interface FileTypeTableProps {
  roles;
  fileTypes;
}

export const FileTypeTable = (props: FileTypeTableProps): JSX.Element => {
  const [editableId, setEditableId] = useState('');
  const [startCreateFileType, setStartCreateFileType] = useState(false);
  const [updateFileType, setUpdateFileType] = useState<FileTypeItem>(null);
  const [newFileType, setNewFileType] = useState<FileTypeItem>(null);
  const [disableCreate, setDisableCreate] = useState(true);
  const [showDelete, setShowDelete] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const newInputRef = useRef(null);

  const { roles, fileTypes } = props;
  if (roles === null || fileTypes === []) {
    return <div />;
  }

  const NameCell = (props: FileTypeRowProps): JSX.Element => {
    const [name, setName] = useState(props.name);
    return (
      <td data-testid="name">
        {props.editable ? (
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            autoFocus
            onBlur={(e) => {
              updateFileType.name = e.target.value;
            }}
          />
        ) : (
          props.name
        )}
      </td>
    );
  };

  const ActionCell = (props: FileTypeRowProps): JSX.Element => {
    const { rowType } = props;

    const Edit = () => {
      return (
        <GoAButton
          data-testid="edit-file-type"
          buttonSize="small"
          disabled={newFileType}
          buttonType="secondary"
          onClick={() => {
            if (editableId !== props.id) {
              setEditableId(props.id);
              // When we select a new line, we will lose unsaved information
              setShowDelete(false);
              setIsEdit(true);
              setUpdateFileType({ ...props });
            }
          }}
        >
          Edit
        </GoAButton>
      );
    };

    const CancelNew = (): JSX.Element => {
      return (
        <GoAButton
          buttonType="secondary"
          buttonSize="small"
          data-testid="cancel-new"
          onClick={() => {
            setStartCreateFileType(false);
            setNewFileType(null);
            setDisableCreate(true);
            setIsEdit(false);
          }}
        >
          Cancel
        </GoAButton>
      );
    };

    const CancelUpdate = (): JSX.Element => {
      return (
        <GoAButton
          buttonType="secondary"
          buttonSize="small"
          data-testid="cancel-update"
          onClick={() => {
            setEditableId('');
            setUpdateFileType(null);
            setIsEdit(false);
          }}
        >
          Cancel
        </GoAButton>
      );
    };
    return (
      <td>
        {rowType === 'update' && props.id === editableId && <CancelUpdate />}
        {rowType === 'update' && props.id !== editableId && <Edit />}
        {props.rowType === 'new' && <CancelNew />}
      </td>
    );
  };

  const DeleteCell = (props: FileTypeRowProps): JSX.Element => {
    const { rowType, id } = props;

    const dispatch = useDispatch();

    const Create = () => {
      return (
        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          key={`${props.id}-confirm-button`}
          onClick={() => {
            dispatch(CreateFileTypeService({ ...newFileType, id }));

            setNewFileType(null);
          }}
          data-testid="confirm-new"
          disabled={disableCreate}
        >
          Confirm
        </GoAButton>
      );
    };

    const Update = (): JSX.Element => {
      return (
        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          data-testid="confirm-update"
          disabled={newFileType}
          onClick={() => {
            dispatch(UpdateFileTypeService({ ...updateFileType, id }));

            setUpdateFileType(null);

            setEditableId('');
          }}
        >
          Confirm
        </GoAButton>
      );
    };

    const Delete = (): JSX.Element => {
      return (
        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          data-testid="delete-file-type"
          disabled={newFileType || isEdit}
          onClick={() => {
            setUpdateFileType(props);
            setShowDelete(true);
          }}
        >
          Delete
        </GoAButton>
      );
    };

    return (
      <td className="right">
        {rowType === 'update' && props.id === editableId && <Update />}
        {props.rowType === 'update' && props.id !== editableId && <Delete />}
        {props.rowType === 'new' && <Create />}
      </td>
    );
  };

  const RolesCell = (props: FileTypeRowProps): JSX.Element => {
    const { readRoles, updateRoles, cellType, rowType, anonymousRead } = props;
    const realmRoles = props.roles;
    const roles = cellType === 'readRoles' ? readRoles : updateRoles;
    let display = '';

    if (anonymousRead && cellType === 'readRoles') {
      display = 'Anonymous';
    } else {
      if (roles) {
        display = roles.join(', ');
      }
    }

    if (rowType === 'new' && display === '') {
      display = 'Select group';
    }

    const displayOnly = !props.editable && rowType !== 'new';

    if (displayOnly) {
      return (
        <RolesCellContainer data-testid={`${rowType}-${cellType}`}>
          {anonymousRead && cellType === 'readRoles' && <Chip type="secondary">Anonymous</Chip>}
          {(!anonymousRead || cellType === 'updateRoles') &&
            roles.map((role) => {
              return (
                <Chip type="secondary" key={`${role}-${props.id}`} data-testid="new-roles">
                  {role}
                </Chip>
              );
            })}
        </RolesCellContainer>
      );
    }

    return (
      <td data-testid={`${rowType}-${cellType}`}>
        <GoADropdown
          title=""
          subTitle=""
          menuHeight={128}
          display={display}
          selectionChanged={(e) => {
            const fileType = { ...props };
            if (e.label === 'Anonymous' && cellType === 'readRoles') {
              fileType.anonymousRead = !props.anonymousRead;
            } else {
              if (e.selected) {
                roles.push(e.value);
              } else {
                const index = roles.indexOf(e.value);
                if (index > -1) {
                  roles.splice(index, 1);
                }
              }
            }
            if (cellType === 'updateRoles') {
              fileType.updateRoles = roles;
            }

            if (cellType === 'readRoles') {
              fileType.readRoles = roles;
            }

            if (rowType === 'update') {
              fileType.name = updateFileType.name;
              setUpdateFileType(fileType);
            }

            if (rowType === 'new') {
              fileType.name = newFileType.name;
              setNewFileType(fileType);
            }
          }}
        >
          {cellType === 'readRoles' && (
            <GoAOption
              value="anonymousRead"
              label="Anonymous"
              key={'anonymous'}
              data-testid="anonymous-option"
              selected={anonymousRead}
            >
              {anonymousRead ? 'Deselect Anonymous' : 'Anyone (Anonymous)'}
            </GoAOption>
          )}

          {!anonymousRead || cellType === 'updateRoles' ? (
            realmRoles.map((realmRole) => {
              return (
                <GoAOption
                  value={realmRole.name}
                  label={realmRole.name}
                  key={realmRole.id}
                  data-testid={`${rowType}-update-roles-options`}
                  selected={roles.includes(realmRole.name)}
                />
              );
            })
          ) : (
            <div></div>
          )}
        </GoADropdown>
      </td>
    );
  };

  const FileTypeRow = (props: FileTypeRowProps) => {
    const editable = props.editable === true;

    return (
      <tr className={editable ? 'selected' : ''}>
        <ActionCell {...{ ...props, rowType: 'update' }} />
        <NameCell editable={editable} {...props} />
        <RolesCell key={`${props.id}-roles-read`} {...{ ...props, cellType: 'readRoles', rowType: 'update' }} />
        <RolesCell key={`${props.id}-roles-edit`} {...{ ...props, cellType: 'updateRoles', rowType: 'update' }} />
        <DeleteCell key={`${props.id}-delete`} {...{ ...props, rowType: 'update' }} />
      </tr>
    );
  };

  const DeleteModal = (props: FileTypeRowProps) => {
    const dispatch = useDispatch();
    const [hasFile, setHasFile] = useState<boolean>(null);
    const fileType = useSelector((state: RootState) =>
      state.fileService.fileTypes.filter((fileType) => {
        return fileType.id === props.id;
      })
    )[0];

    useEffect(() => {
      dispatch(FetchFileTypeHasFileService(props.id));
    }, []);

    useEffect(() => {
      if (fileType?.hasFile !== null) {
        setHasFile(fileType?.hasFile);
      } else {
        dispatch(FetchFileTypeHasFileService(props.id));
      }
    }, [fileType?.hasFile]);

    const CancelButton = () => {
      return (
        <GoAButton
          buttonType="secondary"
          onClick={() => {
            setShowDelete(false);
          }}
        >
          Okay
        </GoAButton>
      );
    };

    return (
      <Dialog open={true} key={props.id} data-testid="delete-modal">
        {hasFile === true && (
          <>
            <DialogTitle>File type current in use</DialogTitle>
            <DialogContent>
              You are unable to delete the file type <b>{`${props.name}`}</b> because there are files within the file
              type.
            </DialogContent>
            <DialogActions>
              <CancelButton data-testid="cancel-delete-modal" />
            </DialogActions>
          </>
        )}

        {hasFile === false && (
          <>
            <DialogTitle>Deleting file type </DialogTitle>
            <DialogContent>
              <p>
                Deleting the file type <b>{`${props.name}`}</b> cannot be undone.
              </p>
              <p>
                <b>Are you sure you want to continue?</b>
              </p>
            </DialogContent>
            <DialogActions>
              <CancelButton data-testid="cancel-delete-modal-button" />
              <GoAButton
                data-testid="delete-modal-delete-button"
                onClick={() => {
                  dispatch(DeleteFileTypeService(props));
                }}
              >
                Delete
              </GoAButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    );
  };

  const newEntryFn = () => {
    setStartCreateFileType(true);
    if (newFileType === null) {
      setNewFileType({
        anonymousRead: false,
        readRoles: [],
        updateRoles: [],
        name: '',
        id: uuid4()
      });
    }
  };

  const NewFileTypeRow = (props: FileTypeRowProps) => {
    const [name, setName] = useState(props.name);
    const { id } = props;
    useEffect(() => {
      if (newInputRef.current) {
        newInputRef.current.focus();
      }
    }, []);

    return (
      <>
        {startCreateFileType && (
          <tr className="selected" key={id}>
            <ActionCell {...{ ...props, rowType: 'new' }} />
            <td data-testid="new-name">
              <input
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  newFileType.name = name;
                }}
                ref={newInputRef}
                onChange={(e) => {
                  setName(e.target.value);
                  newFileType.name = e.target.value;
                  setDisableCreate(e.target.value.length === 0);
                }}
                id="new-file-type-name"
                data-testid="new-file-type-name"
                value={name}
              />
            </td>
            <RolesCell {...{ ...props, rowType: 'new', cellType: 'readRoles' }} data-testid="new-read-roles-cell" />
            <RolesCell {...{ ...props, rowType: 'new', cellType: 'updateRoles' }} data-testid="new-update-roles-cell" />
            <DeleteCell {...{ ...props, rowType: 'new' }} data-testid="cancel-new-cell" />
          </tr>
        )}
      </>
    );
  };

  return (
    <FileTypeTableContainer>
      <GoAButton onClick={newEntryFn} data-testid="new-file-type-button-top" disabled={newFileType || isEdit}>
        New File Type
      </GoAButton>
      {showDelete && <DeleteModal {...updateFileType} />}
      <DataTable data-testid="file-type-table">
        <thead>
          <tr>
            <th id="actions">Actions</th>
            <th id="name">Name</th>
            <th id="read-roles">Who Can Read</th>
            <th id="write-roles">Who Can Edit</th>
            <th id="cancel" className="right">
              Settings
            </th>
          </tr>
        </thead>

        <tbody>
          {newFileType && <NewFileTypeRow {...{ ...newFileType, roles: props.roles }} />}
          {props.fileTypes.map((fileType) => {
            const rowId = `${fileType.id}`;
            if (fileType.id === editableId) {
              return (
                <FileTypeRow
                  key={rowId}
                  name={updateFileType.name}
                  readRoles={updateFileType.readRoles}
                  updateRoles={updateFileType.updateRoles}
                  anonymousRead={updateFileType.anonymousRead}
                  id={updateFileType.id}
                  roles={props.roles}
                  data-testid="update-file-type-row"
                  editable={true}
                  callback={(fileType: FileTypeItem) => {
                    setUpdateFileType(fileType);
                  }}
                />
              );
            }

            return (
              <FileTypeRow
                key={rowId}
                name={fileType.name}
                readRoles={fileType.readRoles}
                updateRoles={fileType.updateRoles}
                anonymousRead={fileType.anonymousRead}
                data-testid="update-file-type-row"
                id={fileType.id}
                roles={props.roles}
                editable={false}
              />
            );
          })}
        </tbody>
      </DataTable>
    </FileTypeTableContainer>
  );
};
