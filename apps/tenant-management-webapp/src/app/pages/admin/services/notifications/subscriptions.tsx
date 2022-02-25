import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { SubscriptionList } from './subscriptionList';
import { getSubscriptions, Unsubscribe } from '@store/subscription/actions';
import type { Subscriber } from '@store/subscription/models';
import { SubscribersSearchForm } from './subscribers/subscriberSearchForm';
import type { SubscriberSearchCriteria } from '@store/subscription/models';
import { CheckSubscriberRoles } from './checkSubscriberRoles';
import { DeleteModal } from '@components/DeleteModal';

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

      {showDeleteConfirmation && (
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete subscription"
          content={`Delete subscription ${selectedSubscription?.channels[emailIndex]?.address}?`}
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(Unsubscribe({ data: { type: selectedType, data: selectedSubscription } }));
          }}
        />
      )}
    </CheckSubscriberRoles>
  );
};

export default Subscriptions;
