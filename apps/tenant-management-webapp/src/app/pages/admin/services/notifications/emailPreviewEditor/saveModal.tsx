import React, { FunctionComponent, useEffect, useState } from 'react';
import type { NotificationItem, Channel } from '@store/notification/models';
import { GoAButton, GoADropdownOption } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { GoADropdown } from '@abgov/react-components';
import { RootState } from '@store/index';
import { GoACallout } from '@abgov/react-components';
import styled from 'styled-components';

interface NotificationTypeFormProps {
  initialValue?: NotificationItem;
  onCancel?: () => void;
  onSave?: (type: NotificationItem) => void;
  onDontSave?: (type: NotificationItem) => void;
  open: boolean;
  errors?: Record<string, string>;
}

export const SaveFormModal: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onDontSave,
  onSave,
  errors,
  open,
}) => {
  //const dispatch = useDispatch();
  const [type, setType] = useState(initialValue);

  useEffect(() => {
    setType(initialValue);
  }, [initialValue]);

  return (
    <EditStyles>
      <GoAModal testId="notification-types-form" isOpen={open}>
        <GoAModalTitle>You have unsaved changes</GoAModalTitle>
        <GoAModelTextWrapper>Leaving this page will discard any changes that haven't been saved</GoAModelTextWrapper>
        <GoAModalActions>
          <GoAButton data-testid="form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
            Cancel
          </GoAButton>
          <GoAButton buttonType="tertiary" data-testid="form-save" type="submit" onClick={(e) => onDontSave(type)}>
            Don't save
          </GoAButton>
          <GoAButton buttonType="primary" data-testid="form-save" type="submit" onClick={(e) => onSave(type)}>
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </EditStyles>
  );
};

const EditStyles = styled.div`
  ul {
    margin-left: 0;
  }

  li {
    border: 1px solid #f1f1f1;
  }

  .fitContent {
    max-width: fit-content;
    min-height: 146px;
  }

  .messages {
    margin-top: 0;
  }

  h3 {
    margin-bottom: 0;
  }
`;

const GoAModelTextWrapper = styled.div`
  padding: 0 1.5rem 0 1.75rem;
  max-width: 36rem;
`;
