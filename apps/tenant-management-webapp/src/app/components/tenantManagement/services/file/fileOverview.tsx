import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TYPES } from '../../../../store/actions';
import { Container, Row, Col } from 'react-bootstrap';
import './file.css';
import { GoAButton } from '@abgov/react-components';
import styled from 'styled-components';

// TODO: need to move the code to core later
const GOAWrapper = styled.a`
  a:link {
    color: #0070c4;
  }

  a:visited {
    color: #756693;
  }

  a:hover {
    color: #004f84;
  }

  a:focus {
    outline-width: thin;
    outline-style: solid;
    outline-color: #004f84;
    outline-offset: 0px;
  }
`;

const OverviewBtn = () => {
  const dispatch = useDispatch();

  return (
    <GoAButton
      content="Enable Service"
      onClick={() => dispatch({ type: TYPES.FILE_ENABLE })}
    />
  );
};

const HelpLink = () => {
  return (
    <div className="file-header-div">
      <span className="file-link-title">Helpful Links</span>
      <br />
      <GOAWrapper>
        <a>File Services Support</a>
      </GOAWrapper>
    </div>
  );
};

const OverviewContent = () => {

  return (
    <Container>
      <Row>
        <Col md={7} sm={12}>
          <p className="file-header-div">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
            volutpat odio est, eget faucibus nisl accumsan eu. Ut sit amet elit
            non elit semper varius. Integer nunc felis, tristique at congue ac,
            efficitur sed ante. Phasellus mi nibh, tempus in ultrices id,
            lacinia sit amet nisi. Vestibulum dictum dignissim nibh a accumsan.
            Vestibulum eget egestas diam. Fusce est massa, venenatis a
            condimentum sed, elementum vel diam.
          </p>
        </Col>

        <Col md={2}></Col>

        <Col md={3}>
          <HelpLink />
        </Col>
      </Row>
    </Container>
  );
};
export default function FileOverview() {
  const active = useSelector((state) => state.File.status.isActive);

  return (
    <div>
      <OverviewContent />

      <div className={active ? 'd-none' : ''} >
        <OverviewBtn />
      </div>
    </div>
  );
}
