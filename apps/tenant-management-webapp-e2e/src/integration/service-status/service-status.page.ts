class StatusServicePage {
  statusTabs() {
    return cy.xpath('//h1[contains(text(), "Status")]/following-sibling::div[1]//descendant::div');
  }

  statusTitle() {
    return cy.get('[data-testid="status-title"]');
  }

  guidelinesTitle() {
    return cy.xpath('//*[contains(text(), "Guidelines for")]');
  }

  addNoticeButton() {
    return cy.get('[data-testid="add-notice"]');
  }

  noticeModalTitle() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//*[@slot="heading"]');
  }

  noticeModalDescField() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//*[@data-testid="notice-form-description"]');
  }

  noticeModalAllApplicationsCheckbox() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//goa-checkbox[@name="isAllApplications"]');
  }

  noticeModalApplicationDropdown() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//*[@id="multiselectContainerReact"]');
  }

  noticeModalApplicationDropdownItem(itemText) {
    return cy.xpath(
      `//*[@data-testid="notice-modal" and @open="true"]//div[@class="optionListContainer displayBlock"]//li[text() = "${itemText}"]`
    );
  }

  noticeModalStartTimeHourField() {
    return cy.xpath(
      '//*[@data-testid="notice-modal" and @open="true"]//div[@class="react-time-picker__inputGroup"]/input[@name="startTime"]/following-sibling::input[@max="12"]'
    );
  }

  noticeModalStartTimeMinuteField() {
    return cy.xpath(
      '//*[@data-testid="notice-modal" and @open="true"]//div[@class="react-time-picker__inputGroup"]/input[@name="startTime"]/following-sibling::input[@max="59"]'
    );
  }

  noticeModalStartTimeAmPmDropdown() {
    return cy.xpath(
      '//*[@data-testid="notice-modal" and @open="true"]//div[@class="react-time-picker__inputGroup"]/input[@name="startTime"]/following-sibling::select[@name="amPm"]'
    );
  }

  noticeModalEndTimeHourField() {
    return cy.xpath(
      '//*[@data-testid="notice-modal" and @open="true"]//div[@class="react-time-picker__inputGroup"]/input[@name="endTime"]/following-sibling::input[@max="12"]'
    );
  }

  noticeModalEndTimeMinuteField() {
    return cy.xpath(
      '//*[@data-testid="notice-modal" and @open="true"]//div[@class="react-time-picker__inputGroup"]/input[@name="endTime"]/following-sibling::input[@max="59"]'
    );
  }

  noticeModalEndTimeAmPmDropdown() {
    return cy.xpath(
      '//*[@data-testid="notice-modal" and @open="true"]//div[@class="react-time-picker__inputGroup"]/input[@name="endTime"]/following-sibling::select[@name="amPm"]'
    );
  }

  noticeModalSaveButton() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//goa-button[@type="primary"]');
  }

  noticeModalCancelButton() {
    return cy.xpath('//*[@data-testid="notice-modal" and @open="true"]//*[@data-testid=notice-form-cancel]');
  }

  noticeList() {
    return cy.xpath('//*[@data-testid="notice-list"]/div/div');
  }

  noticeCardMode(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-mode"]`);
  }

  noticeCardDesc(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-message"]`);
  }

  noticeCardApp(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-application"]`);
  }

  noticeCardStartDateTime(index) {
    return cy.xpath(
      `//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-start-date"]/*[@class="time"]`
    );
  }

  noticeCardEndDateTime(index) {
    return cy.xpath(
      `//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-end-date"]/*[@class="time"]`
    );
  }

  noticeCardGearButton(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-gear-button"]`);
  }

  noticeCardGearButtons() {
    return cy.get('[data-testid="notice-card-gear-button"]');
  }

  noticeCardEditMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-edit"]`);
  }

  noticeCardDeleteMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-delete"]`);
  }

  noticeCardPublishMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-publish"]`);
  }

  noticeCardUnpublishMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-unpublish"]`);
  }

  noticeCardArchiveMenu(index) {
    return cy.xpath(`//*[@data-testid="notice-list"]/div/div[${index}]//*[@data-testid="notice-card-menu-archive"]`);
  }

  filterByStatusRadioGroup() {
    return cy.xpath('//goa-radio-group[@name="option"]');
  }

  applicationHealthChangeNotificationSubscribeCheckbox() {
    return cy.xpath('//goa-checkbox[@name="subscribe"]');
  }

  addApplicationButton() {
    return cy.get('[data-testid="add-application"]');
  }

  addApplicationModalTitle() {
    return cy.xpath(
      '//div[@class="modal-root" and @data-state="visible"]/div[@class="modal"]/div[@class="modal-container"]/div[@class="modal-title"]'
    );
  }

  addApplicationNameModalField() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//goa-input[@name="name"]');
  }

  addApplicationDescriptionModalField() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//goa-textarea[@name="description"]');
  }

  addApplicationEndpointModalField() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//*[label="URL"]//goa-input');
  }

  addApplicationSaveBtn() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//goa-button[text()="Save"]');
  }

  addApplicationCancelBtn() {
    return cy.xpath('//div[@class="modal-root" and @data-state="visible"]//goa-button[text()="Cancel"]');
  }

  applicationCardTitle(appName) {
    return cy.xpath(`//*[@data-testid="application"]//div[contains(text(), "${appName}")]`);
  }

  applicationCardEditBtn(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//*[@data-testid="status-edit-button"]`
    );
  }

  applicationCardDeleteBtn(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//*[@title="Delete"]`
    );
  }

  applicationCardChangeStatusBtn(appName) {
    return cy.xpath(
      `//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//goa-button[text()='Change status']`
    );
  }

  manualStatusChangeModalTitle() {
    return cy.xpath('//*[@class="modal-root" and @data-state="visible"]//*[@class="modal-title"]');
  }

  manualStatusChangeModalStatusRadio(statusName) {
    return cy.xpath(
      `//*[@class="modal-root" and @data-state="visible"]//input[@value="${statusName}"]/following-sibling::div`
    );
  }

  manualStatusChangeModalSaveBtn() {
    return cy.xpath('//*[@class="modal-root" and @data-state="visible"]//goa-button[text()="Save"]');
  }

  applicationCardStatusBadge(appName) {
    return cy.xpath(`//*[@data-testid="application"]/div[contains(text(), "${appName}")]/parent::*//goa-badge`);
  }

  manualStatusChangeModalItemList() {
    return cy.xpath(
      '//*[@class="modal-root" and @data-state="visible"]//*[@class="goa-form-item"]//div/*[@class="goa-radio"]'
    );
  }

  manualStatusChangeModalCheckedRadioBtn() {
    return cy.xpath(
      '//*[@class="modal-root" and @data-state="visible"]//*[@class="goa-form-item"]//div/*[@class="goa-radio"]//input[@type="radio" and @checked]'
    );
  }

  manualStatusChangeModalRadioBtns() {
    return cy.xpath(
      '//*[@class="modal-root" and @data-state="visible"]//*[@class="goa-form-item"]//div/*[@class="goa-radio"]//input[@type="radio"]'
    );
  }

  contactInformationEditBtn() {
    return cy.xpath('//*[@data-testid="edit-contact-info"]//goa-icon-button');
  }

  editContactInformationModal() {
    return cy.xpath('//*[@data-testid="edit-contact-information-status"]//*[@class="modal-title"]');
  }

  editContactInformationEmail() {
    return cy.get('[data-testid="form-email"]');
  }

  editContactInformationEmailSaveBtn() {
    return cy.get('[data-testid="form-save"]');
  }

  editContactInformationEmailCancelBtn() {
    return cy.get('[data-testid="form-cancel"]');
  }

  contactInformationEmailDisplay() {
    return cy.get('[data-testid="email"]');
  }
}
export default StatusServicePage;
