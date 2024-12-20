import styled from 'styled-components';

export const ReviewItem = styled.div`
  display: flex;
  flex-direction: column;
  border: var(--goa-border-width-s) solid grey;
  border-radius: var(--goa-border-radius-m);
  margin: var(--goa-space-2xs);
  padding: var(--goa-space-xs);
  div:empty {
    display: none;
  }
`;
export const ReviewItemSection = styled.div`
  background-color: #f1f1f1;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #dcdcdc;
  border-radius: 5px;
`;
export const ReviewItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;
export const ReviewItemTitle = styled.div`
  font-size: var(--fs-xl);
  line-height: var(--lh-lg);
  font-weight: var(--fw-light);
`;

export const Anchor = styled.div`
  color: #0070c4;
  text-decoration: underline;
  outline: none;
  cursor: pointer;

  &:focus {
    outline: 2px solid #0070c4;
    background-color: #e6f7ff;
  }
`;

export const ReviewListItem = styled.div`
  margin-left: var(--goa-space-m);
`;

export const ReviewListWrapper = styled.div`
  margin-bottom: var(--goa-space-m);
`;
export const ListWithDetail = styled.div`
  margin: var(--goa-space-s);
  width: 100%;
`;
export const ListWithDetailHeading = styled.h3`
  text-transform: capitalize;
`;

export const RightAlignmentDiv = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--goa-space-l);
`;
