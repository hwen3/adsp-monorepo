import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import { EventDefinitions } from './definitions';
import { EventsOverview } from './overview';
import { EventStreams } from './stream';
import { TestStream } from './stream/testStream/testStream';
import { EventDefinitionModalForm } from './edit';
import { defaultEventDefinition, EventDefinition } from '@store/event/models';

export const Events: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const definitions = useSelector((state: RootState) => state.event.definitions);
  const coreNamespaces = useSelector((state: RootState) => {
    return Object.values(state.event.definitions)
      .filter((d: EventDefinition) => d.isCore)
      .map((d: EventDefinition) => d.namespace);
  });

  const [activateEditState, setActivateEditState] = useState<boolean>(false);
  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  return (
    <Page>
      <Main>
        <h1 data-testid="event-title">Event service</h1>
        <Tabs activeIndex={activeIndex} data-testid="events-tabs">
          <Tab label="Overview" data-testid="events-overview-tab">
            <EventsOverview
              setActiveIndex={(index: number) => {
                setActiveIndex(index);
              }}
              setActiveEdit={activateEdit}
            />
          </Tab>
          <Tab label="Definitions" data-testid="events-definitions-tab">
            <EventDefinitions activeEdit={activateEditState} />
          </Tab>

          <Tab label="Streams" data-testid="events-streams-tab">
            <EventStreams />
          </Tab>
          <Tab label="Test stream" data-testid="test-stream-tab">
            <TestStream />
          </Tab>
        </Tabs>

        {activateEditState && (
          <EventDefinitionModalForm
            open={true}
            initialValue={defaultEventDefinition}
            isEdit={false}
            definitions={definitions}
            coreNamespaces={coreNamespaces}
            onClose={() => {
              setActivateEditState(false);
            }}
          />
        )}
      </Main>
      <Aside>
        <>
          <h3>Helpful links</h3>
          <a
            rel="noopener noreferrer"
            target="_blank"
            href={`${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Event service`}
          >
            Read the API docs
          </a>
          <br />
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/event-service"
          >
            See the code
          </a>

          <SupportLinks />
        </>
      </Aside>
    </Page>
  );
};
