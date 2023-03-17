import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAButton, GoAIconButton } from '@abgov/react-components-new';
import _ from 'underscore';
import { generatePdf, updatePdfResponse, showCurrentFilePdf, setPdfDisplayFileId } from '@store/pdf/action';

import {
  SpinnerPadding,
  PreviewTopStyle,
  PreviewTopStyleWrapper,
  PreviewContainer,
  PDFTitle,
} from '../../styled-components';

import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { DownloadFileService } from '@store/file/actions';
import { streamPdfSocket } from '@store/pdf/action';
import { GoAPageLoader } from '@abgov/react-components';
import { useParams } from 'react-router-dom';

interface PreviewTemplateProps {
  channelTitle: string;
}

const base64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export const PreviewTemplate: FunctionComponent<PreviewTemplateProps> = ({ channelTitle }) => {
  const { id } = useParams<{ id: string }>();
  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const pdfTemplate = useSelector((state: RootState) => state?.pdf?.pdfTemplates[id]);
  const jobList = useSelector((state: RootState) => state.pdf.jobs.filter((job) => job.templateId === pdfTemplate.id));

  useEffect(() => {
    dispatch(updatePdfResponse({ fileList: fileList }));
    const currentFile = fileList.find((file) => jobList.map((job) => job.id).includes(file.recordId));
    if (currentFile) {
      dispatch(showCurrentFilePdf(currentFile?.id));
    } else {
      dispatch(setPdfDisplayFileId(null));
    }
  }, [fileList]);

  const generateTemplate = () => {
    const payload = {
      templateId: pdfTemplate.id,
      data: pdfTemplate.variables ? JSON.parse(pdfTemplate.variables) : {},
      fileName: `${pdfTemplate.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
    };
    const saveObject = JSON.parse(JSON.stringify(pdfTemplate));
    dispatch(generatePdf(payload, saveObject));
    // setCurrentTemplate(saveObject);
    // setCurrentSavedTemplate(saveObject);
  };
  const [windowSize, setWindowSize] = useState(window.innerHeight);

  const dispatch = useDispatch();

  const indicator = useSelector((state: RootState) => state?.session?.indicator, _.isEqual);

  const files = useSelector((state: RootState) => state?.pdf.files);

  const currentId = useSelector((state: RootState) => state?.pdf.currentId);

  console.log('Refresh preview');

  const socketChannel = useSelector((state: RootState) => {
    return state?.pdf.socketChannel;
  });
  useEffect(() => {
    if (!socketChannel) {
      dispatch(streamPdfSocket(false));
    }
  }, [socketChannel]);

  useEffect(() => {
    const handleWindowResize = () => {
      if (window.innerHeight !== windowSize) setWindowSize(window.innerHeight);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  });

  const pdfList = useSelector((state: RootState) => state.pdf.jobs, _.isEqual);
  const onDownloadFile = async (file) => {
    file && dispatch(DownloadFileService(file));
  };

  const PdfPreview = () => {
    const blob = files[currentId] && base64toBlob(files[currentId], 'application/pdf');

    const blobUrl = blob && URL.createObjectURL(blob);

    return (
      <>
        <PreviewTop title={channelTitle} />
        {indicator.show ? (
          <SpinnerPadding>
            <GoAPageLoader visible={true} type="infinite" message={indicator.message} />
          </SpinnerPadding>
        ) : (
          blobUrl && (
            <div>
              <div>
                <object type="application/pdf" data={blobUrl} height={windowSize - 200} style={{ width: '100%' }}>
                  <iframe title={'PDF preview'} src={blobUrl} height="100%" width="100%"></iframe>
                </object>
              </div>
            </div>
          )
        )}
      </>
    );
  };

  const PreviewTop = ({ title }) => {
    return (
      <PreviewTopStyleWrapper>
        <PreviewTopStyle>
          <PDFTitle>{title}</PDFTitle>

          <GoAButton
            disabled={indicator.show}
            type="secondary"
            data-testid="form-save"
            size="compact"
            onClick={() => {
              generateTemplate();
            }}
          >
            Generate PDF
          </GoAButton>

          <GoAIconButton
            icon="download"
            title="Download"
            data-testid="download-icon"
            size="medium"
            onClick={() => {
              const file = fileList[0];
              if (file.recordId === pdfList[0].id && file.filename.indexOf(pdfList[0].templateId) > -1) {
                onDownloadFile(file);
              }
            }}
          />
        </PreviewTopStyle>
        <hr className="hr-resize" />
      </PreviewTopStyleWrapper>
    );
  };

  return (
    <PreviewContainer>
      <PdfPreview />
    </PreviewContainer>
  );
};
