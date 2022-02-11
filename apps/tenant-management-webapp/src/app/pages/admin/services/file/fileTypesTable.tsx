import React, { useState } from 'react';
import DataTable from '@components/DataTable';
import { Role } from '@store/tenant/models';
import { FileTypeModal } from './fileTypeModal';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { FileTypeDeleteModal } from './fileTypeDeleteModal';
import styled from 'styled-components';
import { GoABadge } from '@abgov/react-components/experimental';

interface FileTypeRowProps {
  name: string;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
  id: string;
  editId: string;
  editable?: boolean;
  roles?: Role[];
  onEdit?: () => void;
  onDelete?: () => void;
}

interface FileTypeTableProps {
  roles;
  fileTypes;
}

const FileTypeTableRow = ({
  id,
  name,
  readRoles,
  updateRoles,
  anonymousRead,
  editId,
  onEdit,
  onDelete,
}: FileTypeRowProps): JSX.Element => {
  return (
    <tr key={id}>
      <td>{name}</td>
      <td>
        {readRoles.map((role): JSX.Element => {
          return (
            <div key={`read-roles-${id}`}>
              {anonymousRead === true ? (
                'public'
              ) : (
                <GoABadge key={`read-roles-${role}`} type="information" content={role} />
              )}
            </div>
          );
        })}
      </td>
      <td>
        {updateRoles.map((role): JSX.Element => {
          return <GoABadge key={`update-roles-${id}-${role}`} type="information" content={role} />;
        })}
      </td>
      <td className="actionCol">
        <GoAContextMenu>
          <GoAContextMenuIcon
            type="create"
            title="Edit"
            testId={`file-type-row-edit-btn-${id}`}
            onClick={() => {
              onEdit();
            }}
          />
          <GoAIconButton
            testId={`file-type-row-delete-btn-${id}`}
            title="Delete"
            size="medium"
            type="trash"
            onClick={() => {
              onDelete();
            }}
          />
        </GoAContextMenu>
      </td>
    </tr>
  );
};

export const FileTypeTable = ({ roles, fileTypes }: FileTypeTableProps): JSX.Element => {
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const editFileType = fileTypes.find((x) => x.id === editId);
  const deleteFileType = fileTypes.find((x) => x.id === deleteId);

  const editModalProps = {
    fileType: editFileType,
    onCancel: () => {
      setEditId(null);
    },
  };

  const deleteModalProps = {
    fileType: deleteFileType,
    onCancel: () => {
      setDeleteId(null);
    },
  };

  return (
    <div>
      {fileTypes && fileTypes.length > 0 && (
        <TableLayout>
          <DataTable data-testid="file-types-table">
            <thead data-testid="file-types-table-header">
              <tr>
                <th id="name" data-testid="events-definitions-table-header-name">
                  Name
                </th>
                <th id="read-roles">Read roles</th>
                <th id="write-roles">Edit roles</th>
                <th className="actionsCol" id="actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {fileTypes.map((fileType) => {
                const rowProps = {
                  ...fileType,
                  editId,
                };
                return (
                  <FileTypeTableRow
                    key={`file-type-row-${fileType.id}`}
                    {...rowProps}
                    onEdit={() => {
                      setEditId(fileType.id);
                    }}
                    onDelete={() => {
                      setDeleteId(fileType.id);
                    }}
                  />
                );
              })}
            </tbody>
          </DataTable>
        </TableLayout>
      )}
      {editId && <FileTypeModal {...{ ...editModalProps, roles, type: 'edit' }} />}
      {deleteId && <FileTypeDeleteModal {...deleteModalProps} />}
    </div>
  );
};

const TableLayout = styled.div`
  margin-top: 1em;
  table,
  th,
  td {
    .anonymousCol {
      width: 10%;
    }
    .actionsCol {
      width: 15%;
    }
  }
`;
