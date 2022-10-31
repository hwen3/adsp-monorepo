import React, { useState, useEffect, FormEvent } from 'react';
import { GoAHeader, GoACallout } from '@abgov/react-components';
import { IndicatorWithDelay } from '@components/Indicator';

import { Grid, GridItem } from '@components/Grid';
import Footer from '@components/Footer';
import ServiceStatus from './statusCard';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import {
  fetchApplications,
  subscribeToTenant,
  subscribeToTenantSuccess,
  FetchContactInfoService,
} from '@store/status/actions';
import { clearNotification } from '@store/session/actions';
import { toTenantName } from '@store/status/models';
import { RootState } from '@store/index';
import { PageLoader } from '@components/PageLoader';
import { LocalTime } from '@components/Date';
import { GoAPageLoader } from '@abgov/react-components';
import moment from 'moment';
import GoaLogo from '../../assets/goa-logo.svg';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAInputEmail, GoAFormActions } from '@abgov/react-components/experimental';
import { emailError } from '@lib/inputValidation';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const ServiceStatusPage = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const { config } = useSelector((state: RootState) => ({
    config: state.config,
  }));
  const location = useLocation();
  const realm = location.pathname.slice(1) || config.platformTenantRealm;
  const dispatch = useDispatch();

  const { tenantName, loaded, subscriber, applications, error, contact, indicator } = useSelector(
    (state: RootState) => ({
      tenantName: state.session?.tenant?.name,
      loaded: state.session?.isLoadingReady,
      subscriber: state.subscription.subscriber,
      applications: state.application?.applications,
      error: state.session?.notifications,
      contact: state.configuration.contact,
      indicator: state.session.indicator,
    })
  );

  const contactEmail = contact?.contactEmail || 'adsp@gov.ab.ca';

  const { allApplicationsNotices } = useSelector((state: RootState) => ({
    allApplicationsNotices: state.notice?.allApplicationsNotices,
  }));

  useEffect(() => {
    dispatch(fetchApplications(realm));
  }, [realm]);

  useEffect(() => {
    dispatch(FetchContactInfoService(realm));
  }, []);

  useEffect(() => {
    if (error && error.length > 0) {
      dispatch(subscribeToTenantSuccess(null));
    }
  }, [error[error?.length - 1]]);

  const timeZone = new Date().toString().split('(')[1].split(')')[0];

  const Services = () => {
    return (
      <div className="small-container">
        <PageLoader />
        <Title data-testid="service-name">All {capitalizeFirstLetter(tenantName)} services</Title>
        <div className="section-vs">
          These are the services currently being offered by{' '}
          {location.pathname.slice(1) ? capitalizeFirstLetter(tenantName) : 'the Alberta Digital Service Platform'}. All
          statuses are in real time and reflect current states of the individual services. Please{' '}
          <a href={`mailto: ${contactEmail}`}>contact support</a> for additional information, or to report issues, or
          for any other inquiries regarding service statuses.
        </div>

        <div className="section-vs-small">
          {allApplicationsNotices.length > 0 && <AllApplicationsNotices />}
          {applications?.length === 0 && <div>There are no services available by this provider</div>}
        </div>

        {applications?.length > 0 && (
          <div className="title-line">
            <Grid>
              <GridItem md={7}>
                <h3>Service specific statuses and notices</h3>
              </GridItem>
              <div className="line-vs" />
              <GridItem md={5}>
                {allApplicationsNotices?.length === 0 && (
                  <div className="timezone-text">All times are in {timeZone}</div>
                )}
              </GridItem>
            </Grid>
          </div>
        )}

        <Grid>
          {applications.map((app, index) => {
            return (
              <GridItem key={index} md={12} vSpacing={1} hSpacing={0.5}>
                <ServiceStatus
                  data-testid={`service-${app.name}`}
                  name={app.name}
                  state={app.status}
                  date={app.lastUpdated ? moment(app.lastUpdated).calendar() : 'Never Ran Yet'}
                  description={app.description}
                  notices={app.notices}
                />
              </GridItem>
            );
          })}
        </Grid>
      </div>
    );
  };

  const noProvider = () => {
    return (
      <div className="small-container">
        <Title>Provider not found</Title>
        <p>Cannot find a provider at this url</p>
      </div>
    );
  };

  const SectionView = () => {
    if (!applications) {
      if (loaded) {
        return noProvider();
      }
      return <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />;
    } else {
      return Services();
    }
  };

  function formErrorsFunc() {
    const validEmailSelectedConst = emailError(email);

    return { ...validEmailSelectedConst };
  }

  const save = (e: FormEvent) => {
    e.preventDefault();
    const formErrorList = formErrorsFunc();
    if (Object.keys(formErrorList).length === 0) {
      dispatch(clearNotification());
      const payload = { tenant: toTenantName(realm), email: email, type: 'status-application-status-change' };
      dispatch(subscribeToTenant(payload));
      setFormErrors(formErrorList);
    } else {
      setFormErrors(formErrorList);
    }
  };

  const setValue = (name: string, value: string) => {
    setEmail(value);
  };

  const AllApplicationsNotices = () => {
    return (
      <AllApplications>
        <div className="title-line">
          <Grid>
            <GridItem md={6}>
              <h3>All services notice</h3>
            </GridItem>
            <GridItem md={6}>
              <div className="timezone-text">All times are in {timeZone}</div>
            </GridItem>
          </Grid>
        </div>
        {allApplicationsNotices.map((notice) => {
          return (
            <div data-testid="all-application-notice">
              <GoACallout title="Notice" type="important" key={`{notice-${notice.id}}`}>
                <div data-testid="all-application-notice-message">{notice.message}</div>
                <br />
                <div data-testid="service-notice-date-range">
                  From <LocalTime date={notice.startDate} /> to <LocalTime date={notice.endDate} />
                </div>
              </GoACallout>
            </div>
          );
        })}
      </AllApplications>
    );
  };

  const emailIndex = subscriber?.channels?.findIndex((channel) => channel.channel === 'email');

  return (
    <div>
      <GoAHeader
        serviceLevel="live"
        serviceName="Alberta Digital Service Platform - Status & Outages "
        serviceHome="/"
      />
      {/* TODO: re-visit this part when design and card or breadcrumb is ready.
      <div className="goa-banner">
        <div className="small-font">Alberta Digital Service Platform &rarr; Status & Outages</div>
        <hr />
        <h1>Status & Outages</h1>
        <div className="descriptor">Real time monitoring of our applications and services</div>
      </div> */}
      <Main>
        <ServiceStatusesCss>
          <section>
            <SectionView />
          </section>
          <div className="line-vs-small" />
          {applications && (
            <div className="small-container">
              <div>
                <h3>Sign up for notifications</h3>
                <div>
                  Sign up to receive notifications by email for status change of the individual services and notices.
                  Please contact <a href={`mailto: ${contactEmail}`}>{contactEmail}</a> for additional information, or
                  to report issues, or for any other inquiries regarding service statuses.
                </div>
                <div>
                  <GoAForm>
                    <Grid>
                      <GridItem md={4.6}>
                        <GoAFormItem error={formErrors?.['email'] || error?.length > 0}>
                          <GoAFormLabelOverwrite>
                            <label>Enter your email to receive updates</label>
                          </GoAFormLabelOverwrite>
                          <GoAInputEmail
                            id="email"
                            name="email"
                            value={email}
                            data-testid="email"
                            onChange={setValue}
                            aria-label="email"
                          />
                        </GoAFormItem>
                      </GridItem>
                    </Grid>
                  </GoAForm>
                  <GoAFormActionOverwrite>
                    <GoAFormActions alignment="left">
                      <GoAButton buttonType="primary" data-testid="subscribe" onClick={save}>
                        Submit
                      </GoAButton>
                    </GoAFormActions>
                  </GoAFormActionOverwrite>
                </div>
                {subscriber && indicator && !indicator.show && (
                  <GoACallout title="You have signed up for notifications" key="success" type="success">
                    Thank you for signing up. You will receive notifications regarding service statuses on{' '}
                    {subscriber.channels[emailIndex].address}.
                  </GoACallout>
                )}
                {error && error.length > 0 && indicator && !indicator.show && (
                  <GoACallout key="error" type="emergency" title="Your signup attempt has failed">
                    {error[error.length - 1].message}
                  </GoACallout>
                )}
                {indicator && indicator.show && <IndicatorWithDelay message="Loading..." pageLock={false} />}
              </div>
            </div>
          )}
        </ServiceStatusesCss>
      </Main>
      <Footer logoSrc={GoaLogo} />
    </div>
  );
};

const Title = styled.h2`
  && {
    font-weight: var(--fw-regular);
    margin-bottom: 1.5rem;
  }
`;

const Main = styled.main`
  padding-bottom: 10rem;
`;

const ServiceStatusesCss = styled.div`
  .section-vs {
    margin-bottom: 5rem;
  }

  .section-vs-small {
    margin-bottom: 2.5rem;
  }

  .line-vs {
    margin-bottom: 1.5rem;
  }

  .line-vs-small {
    padding-bottom: 1rem;
  }

  h3 {
    margin-bottom: 1.5rem !important;
  }
  .small-container {
    max-width: 50rem;
    margin: 0 auto;
    div.goa-form div {
      padding: 0;
      outline: none;
    }
    div.goa-form input {
      border: none;
      margin: 0;
    }
  }

  .small-font {
    font-size: 0.625rem;
  }

  .flex {
    flex: 1;
  }

  .timezone {
    text-align: right;
    color: #70757a;
    font-size: var(-fs-xs);
  }
`;

const GoAFormActionOverwrite = styled.div`
  .goa-form-actions {
    margin-top: 0px !important;
  }
`;

const GoAFormLabelOverwrite = styled.div`
  label {
    margin-top: 1rem !important;
  }
`;

const AllApplications = styled.div`
  margin-right: 0.5rem;
  title-line: {
    line-height: 2rem;
    margin-bottom: 0.5rem;
  }
  .goa-callout {
    margin: 0px !important;
  }
  .timezone-text {
    font-size: 0.875rem;
    color: #666666;
    line-height: 2rem;
    text-align: right;
  }
`;

export default ServiceStatusPage;
