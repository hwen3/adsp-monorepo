import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { SubscriptionList } from './subscriptionList';
import { getSubscriptions, Unsubscribe } from '@store/subscription/actions';
import type { Subscriber } from '@store/subscription/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { SubscribersSearchForm } from './subscribers/subscriberSearchForm';
import type { SubscriberSearchCriteria } from '@store/subscription/models';
import { CheckSubscriberRoles } from './checkSubscriberRoles';

export const Subscriptions: FunctionComponent = () => {
  const criteriaInit = {
    email: '',
    name: '',
  };
  const dispatch = useDispatch();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscriber>(null);
  const [selectedType, setSelectedType] = useState<string>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const [criteriaState, setCriteriaState] = useState<SubscriberSearchCriteria>(criteriaInit);
  useEffect(() => {
    dispatch(getSubscriptions({}));
  }, []);

  const searchFn = (criteria: SubscriberSearchCriteria) => {
    dispatch(getSubscriptions(criteria));
  };

  const resetState = () => {
    setCriteriaState(criteriaInit);
    dispatch(getSubscriptions({}));
  };

  const emailIndex = selectedSubscription?.channels?.findIndex((channel) => channel.channel === 'email');

  return (
    <CheckSubscriberRoles>
      <SubscribersSearchForm onSearch={searchFn} reset={resetState} />
      <SubscriptionList
        onDelete={(sub: Subscriber, type: string) => {
          setSelectedSubscription(sub);
          setShowDeleteConfirmation(true);
          setSelectedType(type);
        }}
        searchCriteria={criteriaState}
      />
      {/* Delete confirmation */}
      <GoAModal testId="delete-confirmation" isOpen={showDeleteConfirmation}>
        <GoAModalTitle>Delete subscription</GoAModalTitle>
        <GoAModalContent>Delete subscription {selectedSubscription?.channels[emailIndex]?.address}?</GoAModalContent>
        <GoAModalActions>
          <GoAButton buttonType="tertiary" data-testid="delete-cancel" onClick={() => setShowDeleteConfirmation(false)}>
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="delete-confirm"
            onClick={() => {
              setShowDeleteConfirmation(false);
              dispatch(Unsubscribe({ data: { type: selectedType, data: selectedSubscription } }));
            }}
          >
            Confirm
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </CheckSubscriberRoles>
  );
};

export default Subscriptions;
