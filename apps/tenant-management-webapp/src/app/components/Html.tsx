import styled from 'styled-components';

interface PagePros {
  ready?: boolean;
}

const Page = styled.div`
  display: ${(props: PagePros) => (props.ready === true || props.ready === undefined ? 'flex' : 'none')};
  flex-direction: column;
  @media (min-width: 1024px) {
    flex-direction: row;
  }
`;

const Main = styled.main`
  width: 100%;

  h1:first-child,
  h2:first-child,
  h3:first-child {
    margin-top: 0;
  }

  /* Base header margins */
  h1,
  h2,
  h3,
  h4 {
    margin-bottom: 1rem;
    margin-top: 2rem;
  }

  /* Font sizes */
  h1 {
    font-size: var(--fs-2xl);
    font-weight: var(--fw-bold);
  }
  h2 {
    font-size: var(--fs-xl);
    font-weight: var(--fw-bold);
  }
  h3 {
    font-size: var(--fs-lg);
    font-weight: var(--fw-bold);
  }

  /* Set top margin to subsequent headers */
  h1 + h2,
  h1 + h3,
  h1 + h4,
  h2 + h3,
  h2 + h4,
  h3 + h4 {
    margin-top: 2rem;
  }

  // goa-core has padding at the top rather than the bottom
  p {
    margin-top: 0 !important;
    margin-bottom: 1rem;
    font-size: var(--fs-base);
  }

  .thin-font {
    font-weight: 200;
  }

  .padding-bottom-2 {
    padding-bottom: 2em;
  }

  // default padding is way too much
  ul {
    padding-left: 1rem;
  }

  hr {
    border-width: 0;
    border-top: 1px solid #ccc;
    margin: 2rem 0;
  }

  // prevent too much bottom space when a header immediately follows an <hr>
  hr + h1,
  hr + h2,
  hr + h3 {
    margin-top: 0;
  }

  // if content is sectioned off let's give it some padding
  section {
    padding: 1rem 0;
  }
`;

const Aside = styled.aside`
  padding: 0.5rem 0;
  @media (min-width: 1024px) {
    flex: 0 0 200px;
    padding-left: 2rem;
  }
  a {
    display: inline-block;
  }

  h1,
  h2,
  h2,
  h4,
  h5 {
    margin-top: 1rem;
  }

  h1:first-child,
  h2:first-child,
  h2:first-child,
  h4:first-child,
  h5:first-child {
    margin-top: 0;
  }
`;

export { Page, Main, Aside };
