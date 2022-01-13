export const getFooterPreview = (serviceName: string) => {
  return `
  <div>
  <style>
    .goa-footer {
      background-color: var(--light-grey);
      padding-top: 2.5rem;
      padding-top: 3rem;
      padding-bottom: 3rem;
    }
    .goa-footer .link {
      padding-left: 4.5rem;
      flex: 5;
      padding-bottom: 1.5rem;
    }
    .goa-footer .logo {
      padding-right: 6.75rem;
      flex: 1;
    }
    .goa-footer .footer-disclaimer {
      padding-left: 4.5rem;
      padding-right: 5.5rem;
      color: var(--dark-grey);
      padding-top: 1.75rem;

      font-size: 14px;
      text-align: justify;
    }
    .container {
      display: flex;
    }
    .footer-link-border {
      border-bottom: 1px solid var(--grey);
    }
  </style>
  <div class="goa-footer">
    <div class="container footer-link-border">
      <div class="link">
        <span>
          Please do not reply to this email.
        </span>
        <br/>
      </div>
      <div class="logo">
        <img
          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTQ5LjM1MSIgaGVpZ2h0PSI0MiINCiAgdmlld0JveD0iMCAwIDE0OS4zNTEgNDIiPg0KICA8ZGVmcz4NCiAgICA8c3R5bGU+DQogICAgICAuYSB7DQogICAgICAgIGZpbGw6IG5vbmU7DQogICAgICB9DQoNCiAgICAgIC5iIHsNCiAgICAgICAgY2xpcC1wYXRoOiB1cmwoI2EpOw0KICAgICAgfQ0KDQogICAgICAuYyB7DQogICAgICAgIGZpbGw6ICMwMGFhZDI7DQogICAgICB9DQoNCiAgICAgIC5kIHsNCiAgICAgICAgZmlsbDogIzVmNmE3MjsNCiAgICAgIH0NCiAgICA8L3N0eWxlPg0KICAgIDxjbGlwUGF0aCBpZD0iYSI+DQogICAgICA8cmVjdCBjbGFzcz0iYSIgd2lkdGg9IjE0OS4zNTEiIGhlaWdodD0iNDIiIC8+DQogICAgPC9jbGlwUGF0aD4NCiAgPC9kZWZzPg0KICA8ZyBjbGFzcz0iYiI+DQogICAgPHJlY3QgY2xhc3M9ImMiIHdpZHRoPSIxMy41NTUiIGhlaWdodD0iMTMuNTU1IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMzUuNzk2IDIxLjUyNCkiIC8+DQogICAgPHBhdGggY2xhc3M9ImQiDQogICAgICBkPSJNNjMuMDgyLDMzLjA4OGMtMS4zODMuMTM4LTIuODM1LjI3Ny00LjM1Ny4zNDYuNTUzLTQuMzU3LDIuODM1LTEwLjM3Myw1LjY3MS05LjQwNSwxLjY2LjU1My43NjEsNS42NzEtMS4zMTQsOS4wNTltLTMuNTI3LDIuOTc0YTMuNzYxLDMuNzYxLDAsMCwxLTEuMjQ1LDAsLjg1MS44NTEsMCwwLDAsLjM0Ni0uNjkydi0uNTUzYy43NjEsMCwxLjkzNi0uMTM4LDMuMzg5LS4yNzdhNC4zMjcsNC4zMjcsMCwwLDEtMi40OSwxLjUyMU03Ni44NDQsMjUuNjg4YzEuOC0xLjY2LDIuNy0xLjUyMSwyLjktMS4xMDYuNDg0Ljk2OC0xLjU5MSw0LjM1Ny01LjY3MSw2LjIyNGExMC4zMjgsMTAuMzI4LDAsMCwxLDIuNzY2LTUuMTE4bTY2LjczNiwxLjY2Yy0uMjA3LTMuMzg5LTMuMTgxLTMuOTQyLTMuNi0yLjk3NC0uMTM4LjM0NiwxLjEwNi4yMDcsMS4xMDYsMi42MjgsMCwzLjk0Mi00LjAxMSw5LjEyOS05LjEyOSw5LjEyOS01LjUzMiwwLTYuOTg1LTQuMzU3LTcuMjYxLTYuNDMyLS4yMDctMS40NTIuMTM4LTMuNDU4LTIuMzUxLTMuMTgxLTEuNzI5LjIwNy0zLjI1LDMuNTI3LTUuNDYzLDYuMzYyLTEuODY3LDIuNDItMi43LDIuMjEzLTIuMjgyLjEzOC41NTMtMi42MjgsMi43LTguNzE0LDUuMTg3LTkuMTI5LDEuMTc2LS4yMDcsMS41OTEsMS44LDIuMDc1LjU1M3MuMDY5LTQuMDExLTIuNTU5LTQuMDExYy0xLjgsMC0zLjk0MiwxLjkzNi01Ljc0LDQuMDgtMS41MjEsMS45MzYtOS4zMzYsMTMuNDE2LTEyLjY1NiwxMC45MjctMS41MjEtMS4xNzYtMS4zODMtNS44NzgtLjQxNS0xMS40MTEsMy44NzMtMS41MjEsNy4xMjMtMS4wMzcsOC45MjEtLjEzOC45LjQxNSwxLjAzNy4zNDYuNjIyLS42MjItLjU1My0xLjQ1Mi0zLjY2NS0zLjczNC04LjU3NS0yLjctLjEzOCwwLS4yMDcuMDY5LS4zNDYuMDY5LjQxNS0xLjguODMtMy42NjUsMS4zODMtNS40NjMuNDg0LTEuNjYsMS44LTQuNS0xLjcyOS00Ljk3OS0xLjEwNi0uMjA3LS42MjIuMzQ2LTEuMDM3LDEuODY3LS42OTIsMi43NjYtMS41MjEsNi4zNjItMi4xNDQsMTAuMDI4YTE5Ljc0NSwxOS43NDUsMCwwLDAtNy41MzgsOC4wOTEsMzguNTksMzguNTksMCwwLDAsLjktNC43NzIsMS41ODksMS41ODksMCwwLDAtMS4yNDUtMS43MjljLS43NjEtLjIwNy0xLjcyOS4xMzgtMi42MjgsMS40NTItMi4xNDQsMy4wNDMtNC44NDEsNy44MTUtOC45OSw5LjgyLTIuOTc0LDEuNDUyLTQuMjg4LDAtNC4zNTctMi4yODJhOS44NjksOS44NjksMCwwLDAsMS41MjEtLjU1M2M1LjM5NC0yLjM1MSw3LjE5Mi01Ljk0Nyw1Ljg3OC04LjE2LTEuMzE0LTIuMDc1LTQuOTc5LTEuNDUyLTcuOTUzLDEuNjZhMTEuMTc1LDExLjE3NSwwLDAsMC0yLjcsNi41Yy0xLjI0NS4yNzctMi42MjguNDg0LTQuMjE5LjY5MiwyLjQ5LTQuMDgsMi4yODItOS42MTMtMS4zODMtMTAuNTgxLTQuMjg4LTEuMTA2LTYuNDMyLDMuMDQzLTcuMzMxLDYuNS4zNDYtMy44NzMuOS03Ljc0NSwxLjU5MS0xMS41NDkuMzQ2LTEuNjYsMS40NTItNC41LTIuMDc1LTQuOTc5LTEuMTA2LS4yMDctLjk2OC4zNDYtLjksMS44NjcuMTM4LDIuMDc1LTIuMTQ0LDE0LjQ1NC0uOTY4LDE5Ljg0OC0xLjUyMS40ODQtMi4xNDQsMS42Ni0uMjA3LDIuODM1LDEuMzgzLjgzLDQuMzU3LDEuMTA2LDcuMzMxLS4zNDZhOS4zLDkuMywwLDAsMCwyLjc2Ni0yLjE0NGMxLjgtLjIwNywzLjY2NS0uNTUzLDUuMzk0LS44My4yNzcsMi40MiwxLjg2Nyw0LjIxOSw1LjQ2MywzLjg3Myw1LjExOC0uNDg0LDkuNjgyLTYuNzc3LDExLjQxMS05LjgyLS4zNDYsMy4yNS0yLjQyLDEwLjM3MywxLjE3NiwxMC4wMjgsMS4zODMtLjEzOC44My0uMzQ2LjktMS41OTEuMzQ2LTQuMjg4LDMuODczLTcuOTUzLDcuNC0xMC4xNjYtLjYyMiw1LjI1Ni0uNDE1LDkuOTU4LDIuMDA2LDExLjQxMSw0LjQyNiwyLjc2NiwxMC41ODEtNC41LDE0LjAzOS04LjkyMS0xLjcyOSwzLjk0Mi0yLjcsOC45MjEtLjEzOCw5LjY4MiwzLjA0My45LDUuNDYzLTQuMjE5LDguMy04LjA5MS4zNDYsMi43NjYsMi4yMTMsNy42MDcsOS42ODIsNy42MDcsOC4wMjItLjA2OSwxMy4wNzEtNC45MSwxMi44NjMtMTAuMW0tMTA4LjMsOC42NDVBNjYuNDM5LDY2LjQzOSwwLDAsMSwyNy40LDMyLjUzNGE1OS4xNjgsNTkuMTY4LDAsMCwwLDYuNzc3LTIuOTc0LDU0LjQ1Myw1NC40NTMsMCwwLDAsMS4xMDYsNi40MzJtMjAuNCwzLjg3M2MtLjA2OS0uMjA3LS42MjIuMDY5LTEuMTA2LDAtMS40NTItLjIwNy0zLjM4OS0yLjIxMy0zLjk0Mi01LjQ2My0xLjAzNy01Ljg3OC0uNDE1LTExLjY4NywxLjMxNC0yMC4zMzIuMzQ2LTEuNjYsMS40NTItNC41LTIuMDc1LTUuMDQ4LTEuMTA2LS4xMzgtLjU1My40MTUtLjgzLDEuODY3QzQ3LjY2LDE3LjMyLDQyLjQsMjEuOTU0LDM3LjE0OSwyNS4wNjYsMzYuNiwxNy43MzUsMzYuOCw5LjUwNSwzOC4xODYsNC41MjZjMS4xNzYtNC4yMTksMi41NTktMy40NTguODMtNC4zNTdzLTMuNzM0LjI3Ny01LjMyNSwzLjQ1OFMyNC44MzksMjMuODksMTMuMjIxLDM1LjQzOUM3LjI3Myw0MS4zMTcsMS44NzksMzguMjc0Ljg0MiwzNy4zNzVjLS45LS43NjEtMS4xNzYuNDE1LS4xMzgsMS41OTEsNC43NzIsNS4yNTYsMTEuODI2LDIuMjgyLDE0LjM4NC0uMjc3LDcuMDU0LTcuMDU0LDE1LjI4My0yMi4yNjgsMTguNi0yOC43YTk4LjI1MSw5OC4yNTEsMCwwLDAsLjI3NywxNi44NzQsNTAuMTI5LDUwLjEyOSwwLDAsMS04LjMsMy4xODFjLTEuNjYuNDE1LTIuNywxLjEwNi0yLjcsMS44NjdzMS4xMDYsMS41MjEsMi43LDIuMjgyYzIuODM1LDEuMzgzLDExLjIsNS4yNTYsMTMuMjA5LDYuNSwxLjcyOSwxLjAzNywyLjYyOC4yMDcsMy4xMTItLjkuNjkyLTEuNDUyLTEuMTc2LTIuMjgyLTIuOTc0LTIuNzY2YTYwLjU0NSw2MC41NDUsMCwwLDEtMS42Ni05LjI2N2M0LjIxOS0yLjYyOCw4LjQzNy02LjA4NiwxMC43ODgtMTAuNDQzQzQ3LjUyMiwyMC45MTYsNDYsMzMuMyw0OS44NzMsMzguNDgyYTUuNDUxLDUuNDUxLDAsMCwwLDQuNTY0LDIuMjEzYy45NjgtLjA2OSwxLjM4My0uNjkyLDEuMjQ1LS44MyINCiAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjAzOCAwLjEyNCkiIC8+DQogIDwvZz4NCjwvc3ZnPg=="
        />
      </div>
    </div>
    <div class="footer-disclaimer">
      This email was sent from the <b>${serviceName}</b> and any files transmitted
      with it are confidential and intended solely for the use of the individual
      For entity to whom they are addressed. If you have received this email in
      error please notify the system manager. This message contains confidential
      information and is intended only for the individual named. If you are not
      the named addressee you should not disseminate, distribute or copy this
      e-mail.
    </div>
  </div>
</div>
`;
};
