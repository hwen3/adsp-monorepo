import React, { FunctionComponent, useEffect, useState } from 'react';
import { AddEditPdfTemplate } from './addEditPdfTemplates';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, updatePdfTemplate, deletePdfTemplate } from '@store/pdf/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { PdfTemplatesTable } from './templatesList';
import { PageIndicator } from '@components/Indicator';
import { defaultPdfTemplate } from '@store/pdf/model';

import { DeleteModal } from '@components/DeleteModal';

interface PdfTemplatesProps {
  openAddTemplate: boolean;
}
export const PdfTemplates: FunctionComponent<PdfTemplatesProps> = ({ openAddTemplate }) => {
  const [openAddPdfTemplate, setOpenAddPdfTemplate] = useState(false);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const pdfTemplates = useSelector((state: RootState) => {
    return Object.entries(state?.pdf?.pdfTemplates)
      .sort((template1, template2) => {
        return template1[1].name.localeCompare(template2[1].name);
      })
      .reduce((tempObj, [pdfTemplateId, pdfTemplateData]) => {
        tempObj[pdfTemplateId] = pdfTemplateData;
        return tempObj;
      }, {});
  });

  const [currentTemplate, setCurrentTemplate] = useState(defaultPdfTemplate);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const dispatch = useDispatch();

  const reset = () => {
    setOpenAddPdfTemplate(false);
    setCurrentTemplate(defaultPdfTemplate);
  };

  useEffect(() => {
    if (openAddTemplate) {
      setOpenAddPdfTemplate(true);
    }
  }, [openAddTemplate]);
  useEffect(() => {
    dispatch(getPdfTemplates());
  }, []);

  // eslint-disable-next-line
  useEffect(() => {}, [pdfTemplates]);

  return (
    <>
      <div>
        <br />
        <GoAButton
          data-testid="add-template"
          onClick={() => {
            setOpenAddPdfTemplate(true);
          }}
        >
          Add template
        </GoAButton>
        <br />
        <br />
        <PageIndicator />
        {openAddPdfTemplate && (
          <AddEditPdfTemplate
            open={openAddPdfTemplate}
            isEdit={false}
            onClose={reset}
            initialValue={defaultPdfTemplate}
            onSave={(template) => {
              dispatch(updatePdfTemplate(template));
            }}
          />
        )}
        {!indicator.show && !pdfTemplates && renderNoItem('pdf templates')}
        {!indicator.show && pdfTemplates && (
          <PdfTemplatesTable
            templates={pdfTemplates}
            onDelete={(currentTemplate) => {
              setShowDeleteConfirmation(true);
              setCurrentTemplate(currentTemplate);
            }}
          />
        )}
        {/* Delete confirmation */}
        {showDeleteConfirmation && (
          <DeleteModal
            isOpen={showDeleteConfirmation}
            title="Delete PDF template"
            content={
              <div>
                Delete <b>{`${currentTemplate?.name} (ID: ${currentTemplate?.id})?`}</b>
              </div>
            }
            onCancel={() => setShowDeleteConfirmation(false)}
            onDelete={() => {
              setShowDeleteConfirmation(false);
              dispatch(deletePdfTemplate(currentTemplate));
            }}
          />
        )}
      </div>
    </>
  );
};
