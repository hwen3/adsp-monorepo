import React, { FormEvent, useState, useEffect } from 'react';
import { GoAButton, GoARadio } from '@abgov/react-components';
import { GoAInputEmail, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { useDispatch, useSelector } from 'react-redux';
import { patchSubscriber } from '@store/subscription/actions';
import { actionTypes } from '@store/subscription/models';
import { Channels } from '@store/subscription/models';
import { Grid, GridItem } from '@components/Grid';
import { SubscriberChannel, Subscriber } from '@store/subscription/models';
import { InfoCard } from './InfoCard';
import { Label } from './styled-components';
import { GapVS } from './styled-components';
import { RootState } from '@store/index';
import { phoneWrapper } from '@lib/wrappers';
import { GoAPageLoader } from '@abgov/react-components';

interface ContactInfoCardProps {
  subscriber: Subscriber;
}

export const ContactInfoCard = ({ subscriber }: ContactInfoCardProps): JSX.Element => {
  const dispatch = useDispatch();
  const [formErrors, setFormErrors] = useState({});
  const subscriberEmail = subscriber?.channels.filter((chn: SubscriberChannel) => chn.channel === Channels.email)[0]
    ?.address;
  const subscriberSMS =
    subscriber?.channels.filter((chn: SubscriberChannel) => chn.channel === Channels.sms)[0]?.address || '';

  const subscriberPreferredChannel = subscriber?.channels ? subscriber?.channels[0].channel : null;

  const [emailContactInformation, setEmailContactInformation] = useState(subscriberEmail);
  const [SMSContactInformation, setSMSContactInformation] = useState(subscriberSMS);
  const [editContactInformation, setEditContactInformation] = useState(false);
  const [preferredChannel, setPreferredChannel] = useState(subscriberPreferredChannel);
  const indicator = useSelector((state: RootState) => {
    const indicator = state.session?.indicator;
    if (indicator) {
      return (
        indicator?.show &&
        indicator.action &&
        [actionTypes.updatePreference, actionTypes.updateContactInfo].includes(indicator.action)
      );
    }
    return false;
  });

  const setValue = (name: string, value: string) => {
    switch (name) {
      case Channels.email:
        setEmailContactInformation(value);
        break;
      case Channels.sms: {
        if (inValidSMSInput(value)) {
          if (!(value && value.length > 10)) {
            setSMSContactInformation(value);
          }
        }
        break;
      }
    }
  };
  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const isValidEmail = (email: string): boolean => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  const isValidSMS = (sms: string): boolean => {
    if (sms) {
      return /^[0-9]{10}$/.test(sms);
    }
    // allow empty phone number
    return true;
  };

  const inValidSMSInput = (smsInput: string): boolean => {
    if (smsInput) {
      // eslint-disable-next-line
      return /^[0-9\.\-\/]+$/.test(smsInput);
    }

    return true;
  };

  const sanitizeSMS = (sms: string) => {
    return sms
      .toLowerCase()
      .split('')
      .filter((c) => c >= '0' && c <= '9')
      .join('');
  };

  const saveContactInformation = async (e: FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!isValidEmail(emailContactInformation)) {
      setFormErrors({ email: 'You must enter a valid email.' });
      return;
    }

    if (preferredChannel === Channels.sms && !SMSContactInformation) {
      setFormErrors({ sms: 'SMS is set as the preferred channel. A valid SMS number is required.' });
      return;
    }

    if (!isValidSMS(SMSContactInformation)) {
      setFormErrors({ sms: 'You must enter a valid phone number.' });
      return;
    }
    let channels = [];

    if (subscriber.channels) {
      channels = [...subscriber.channels];
    }

    const emailChannelIndex = subscriber.channels.findIndex((channel) => {
      return channel.channel === Channels.email;
    });

    const smsChannelIndex = subscriber.channels.findIndex((channel) => {
      return channel.channel === Channels.sms;
    });

    if (emailChannelIndex !== -1) {
      channels[emailChannelIndex].address = emailContactInformation;
    } else {
      channels = [
        ...channels,
        {
          channel: Channels.email,
          address: emailContactInformation,
        },
      ];
    }

    if (smsChannelIndex !== -1) {
      if (SMSContactInformation) {
        channels[smsChannelIndex].address = sanitizeSMS(SMSContactInformation);
      } else {
        channels.splice(smsChannelIndex, 1);
      }
    } else {
      if (SMSContactInformation) {
        channels = [
          ...channels,
          {
            channel: Channels.sms,
            address: sanitizeSMS(SMSContactInformation),
          },
        ];
      }
    }

    const index = channels.findIndex((c) => {
      return c.channel === preferredChannel;
    });
    if (index !== -1 && index !== 0) {
      const tmp = channels[index];
      channels.splice(index, 1);
      channels = [tmp, ...channels];
    }

    dispatch(patchSubscriber(channels, subscriber.id, actionTypes.updateContactInfo));
    setEditContactInformation(!editContactInformation);
  };

  const updateContactInfoButtons = () => {
    return (
      <div>
        <GoAButton buttonSize="small" data-testid="edit-contact-save-button" onClick={saveContactInformation}>
          Save
        </GoAButton>

        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          data-testid="edit-contact-cancel-button"
          onClick={() => {
            setEditContactInformation(!editContactInformation);
            setFormErrors({});
          }}
        >
          Cancel
        </GoAButton>
      </div>
    );
  };

  const updateChannelPreference = (channel: string) => {
    setPreferredChannel(channel);
  };

  return (
    <InfoCard title="Contact information">
      {!indicator && (
        <div>
          {editContactInformation ? (
            <Grid>
              <GridItem md={3.5} hSpacing={1}>
                <Label>Email</Label>
                <GoAFormItem error={formErrors?.['email']}>
                  <GoAInputEmail
                    aria-label="email"
                    name="email"
                    value={emailContactInformation}
                    onChange={setValue}
                    data-testid="contact-email-input"
                  />
                </GoAFormItem>
              </GridItem>

              <GridItem md={3.5} hSpacing={1}>
                <Label>Phone number</Label>

                <GoAFormItem error={formErrors?.['sms']}>
                  <GoAInput
                    type="text"
                    aria-label="sms"
                    name="sms"
                    value={SMSContactInformation}
                    data-testid="contact-sms-input"
                    onChange={setValue}
                    trailingIcon="close"
                    onTrailingIconClick={() => {
                      setSMSContactInformation('');
                    }}
                  />
                </GoAFormItem>
              </GridItem>

              <GridItem md={5}>
                <Label>My preferred notification channel</Label>
                <GoARadio
                  key="channel-preference-email"
                  value={Channels.email}
                  testId="preferred-channel-email-opt"
                  checked={preferredChannel === Channels.email}
                  onChange={updateChannelPreference}
                >
                  Email
                </GoARadio>
                <GoARadio
                  key="channel-preference-sms"
                  value={Channels.sms}
                  testId="preferred-channel-sms-opt"
                  checked={preferredChannel === Channels.sms}
                  onChange={updateChannelPreference}
                >
                  SMS
                </GoARadio>
              </GridItem>
            </Grid>
          ) : (
            <div>
              <Grid>
                <GridItem md={3.5} hSpacing={1}>
                  <div data-testid="email-label">
                    <Label>Email</Label>
                    <p>{subscriberEmail}</p>
                  </div>
                </GridItem>
                <GridItem md={3.5} hSpacing={1}>
                  <div data-testid="phone-number-label">
                    <Label>Phone number</Label>
                    <p>{phoneWrapper(subscriberSMS)}</p>
                  </div>
                </GridItem>
                <GridItem md={5}>
                  <Label>My preferred notification channel</Label>
                  <GoARadio
                    key="channel-preference-email"
                    value={Channels.email}
                    disabled={true}
                    testId="preferred-channel-email-opt"
                    checked={preferredChannel === Channels.email}
                    //eslint-disable-next-line
                    onChange={() => {}}
                  >
                    Email
                  </GoARadio>
                  <GoARadio
                    key="channel-preference-sms"
                    value={Channels.sms}
                    disabled={true}
                    testId="preferred-channel-sms-opt"
                    checked={preferredChannel === Channels.sms}
                    //eslint-disable-next-line
                    onChange={() => {}}
                  >
                    SMS
                  </GoARadio>
                </GridItem>
              </Grid>
            </div>
          )}
        </div>
      )}
      {indicator && <GoAPageLoader visible={true} type="infinite" message={'Loading...'} pagelock={true} />}
      <GapVS />
      <div>
        {editContactInformation ? (
          updateContactInfoButtons()
        ) : (
          <GoAButton
            buttonSize="small"
            data-testid="edit-contact-button"
            onClick={() => {
              setEditContactInformation(!editContactInformation);
              setEmailContactInformation(subscriberEmail);
              setSMSContactInformation(subscriberSMS);
              setPreferredChannel(subscriberPreferredChannel);
            }}
          >
            Edit contact information
          </GoAButton>
        )}
      </div>
    </InfoCard>
  );
};
