import React, { useCallback, useState } from 'react';
import { ArrayLayoutProps, RankedTester, rankWith, uiTypeIs, and } from '@jsonforms/core';
import { withJsonFormsArrayLayoutProps } from '@jsonforms/react';
import { ListWithDetailControl } from './ListWithDetailControl';
import { DeleteDialog } from './DeleteDialog';
import { Visible } from '../../util';

export const ListWithDetailsControl = (props: ArrayLayoutProps) => {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string>();
  const [name, setName] = useState<string>();
  const [rowData, setRowData] = useState<number>(0);
  const { removeItems, visible } = props;

  const openDeleteDialog = useCallback(
    (p: string, rowIndex: number, name?: string) => {
      setOpen(true);
      setPath(p);
      setName(name);
      setRowData(rowIndex);
    },
    [setOpen, setPath, setRowData]
  );
  const deleteCancel = useCallback(() => setOpen(false), [setOpen]);

  // eslint-disable-next-line
  const deleteConfirm = useCallback(() => {
    const p = path?.substring(0, path.lastIndexOf('.'));
    if (removeItems && p) {
      removeItems(p, [rowData])();
    }
    setOpen(false);
    // eslint-disable-next-line
  }, [setOpen, path, rowData]);

  return (
    <Visible visible={visible}>
      <ListWithDetailControl {...props} openDeleteDialog={openDeleteDialog} />

      <DeleteDialog
        open={open}
        onCancel={deleteCancel}
        onConfirm={deleteConfirm}
        title={props.translations.deleteDialogTitle || ''}
        message={`Are you sure you wish to delete ${name} `}
      />
    </Visible>
  );
};

export const GoAListWithDetailsControlRenderer = withJsonFormsArrayLayoutProps(ListWithDetailsControl);
export const GoAListWithDetailsTester: RankedTester = rankWith(3, and(uiTypeIs('ListWithDetail')));
