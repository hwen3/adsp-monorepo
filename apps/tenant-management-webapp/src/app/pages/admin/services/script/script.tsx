import React, { useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { ScriptOverview } from './overview';
import SupportLinks from '@components/SupportLinks';
import BetaBadge from '@icons/beta-badge.svg';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { ScriptsView } from './scriptsView';
import { HeadingDiv } from './styled-components';
import { Gapadjustment, Hyperlinkcolor } from '@pages/admin/dashboard/styled-components';
import { ExternalLink } from '@components/icons/ExternalLink';
export const Script = (): JSX.Element => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };
  function getScriptDocsLink() {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Script service`;
  }
  function getScriptsupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/script-service';
  }
  return (
    <Page>
      <Main>
        <>
          <HeadingDiv>
            <h1 data-testid="script-service-title">Script service</h1> <img src={BetaBadge} alt="Files Service" />
          </HeadingDiv>
          <Tabs activeIndex={activeIndex}>
            <Tab label="Overview">
              <ScriptOverview setActiveIndex={setActiveIndex} setActiveEdit={activateEdit} />
            </Tab>
            <Tab label="Scripts">
              <ScriptsView activeEdit={activateEditState} />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <>
          <Gapadjustment>Helpful links</Gapadjustment>
          <Hyperlinkcolor>
            <ExternalLink link={getScriptDocsLink()} text="Read the API docs" />
          </Hyperlinkcolor>

          <Hyperlinkcolor>
            <ExternalLink link={getScriptsupportcodeLink()} text="See the code" />
          </Hyperlinkcolor>

          <SupportLinks />
        </>
      </Aside>
    </Page>
  );
};
