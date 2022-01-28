@notifications
Feature: Notifications

  @TEST_CS-945 @REQ_CS-641 @REQ_CS-788 @REQ_CS-979 @regression
  Scenario: As a service owner, I can add/edit/delete Notification Types
    Given a service owner user is on notification overview page
    When the user clicks Add notification type button
    Then the user views Add notification modal
    When the user enters "autotest-addNotificationType", "autotest notification desc", "Anyone (Anonymous)"
    And the user clicks save button
    Then the user "views" the notification type card of "autotest-addNotificationType", "autotest notification desc", "Anyone (Anonymous)", "yes"
    # Verify there is Add notification button on the notification type page as well after saving a new notification type
    And the user views Add notification type button on Notification types page
    When the user clicks "edit" button for the notification type card of "autotest-addNotificationType"
    Then the user views Edit notification type modal for "autotest-addNotificationType"
    When the user enters "autotest-editNotificationType", "Edited notification type desc", "auto-test-role1, file-service-admin"
    And the user clicks save button
    Then the user "views" the notification type card of "autotest-editNotificationType", "Edited notification type desc", "auto-test-role1, file-service-admin", "no"
    When the user clicks "delete" button for the notification type card of "autotest-editNotificationType"
    Then the user views delete confirmation modal for "autotest-editNotificationType"
    When the user clicks Confirm button on delete confirmation modal
    Then the user "should not view" the notification type card of "autotest-editNotificationType", "Edited notification type desc", "auto-test-role1, file-service-admin", "no"

  # TEST DATA: a precreated notification type named "autotest-notificationType" with an event other than "tenant-service:tenant-created"
  @TEST_CS-949 @REQ_CS-277 @regression
  Scenario: As a service owner, I can add and delete events of a notification type
    Given a service owner user is on notification types page
    # Add an event and verify the event can't be added again
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    When the user selects "tenant-service:tenant-created" in the event dropdown
    And the user clicks Next button on Select an event page
    Then the user views Add an email template page
    When the user enters "autotest subject" as subject and "autotest body" as body
    And the user clicks Add button in Add an email template page
    Then the user "views" the event of "tenant-service:tenant-created" in "autotest-notificationType"
    When the user clicks Select event button for "autotest-notificationType"
    Then the user views Select an event modal
    When the user cannot select "tenant-service:tenant-created" in the event dropdown
    And the user clicks Cancel button in Select an event modal
    # Delete an event
    When the user clicks "delete" button for "tenant-service:tenant-created" in "autotest-notificationType"
    Then the user views Remove event modal for "tenant-service:tenant-created"
    When the user clicks Confirm button in Remove event modal
    Then the user "should not view" the event of "tenant-service:tenant-created" in "autotest-notificationType"

  @TEST_CS-976 @REQ_CS-906 @regression
  Scenario: Test the registration of notification type in status service for application health change
    Given a service owner user is on notification types page
    # Verify the type and its events
    Then the user "views" the notification type card of "status-application-health-change"
    And the user "views" the event of "status-service:health-check-started" in "status-application-health-change"
    And the user "views" the event of "status-service:health-check-stopped" in "status-application-health-change"
    And the user "views" the event of "status-service:application-unhealthy" in "status-application-health-change"
    And the user "views" the event of "status-service:application-healthy" in "status-application-health-change"
    # Verify the events' email icons and preview links, and no edit buttons
    And the user "views" "email template indicator" for "status-service:health-check-started" in "status-application-health-change"
    And the user "views" "Preview link" for "status-service:health-check-started" in "status-application-health-change"
    And the user "should not view" "Edit button" for "status-service:health-check-started" in "status-application-health-change"
    And the user "views" "email template indicator" for "status-service:health-check-stopped" in "status-application-health-change"
    And the user "views" "Preview link" for "status-service:health-check-stopped" in "status-application-health-change"
    And the user "should not view" "Edit button" for "status-service:health-check-stopped" in "status-application-health-change"
    And the user "views" "email template indicator" for "status-service:application-unhealthy" in "status-application-health-change"
    And the user "views" "Preview link" for "status-service:application-unhealthy" in "status-application-health-change"
    And the user "should not view" "Edit button" for "status-service:application-unhealthy" in "status-application-health-change"
    And the user "views" "email template indicator" for "status-service:application-healthy" in "status-application-health-change"
    And the user "views" "Preview link" for "status-service:application-healthy" in "status-application-health-change"
    And the user "should not view" "Edit button" for "status-service:application-healthy" in "status-application-health-change"
    # Verify email template is read-only (pick one event)
    When the user clicks Preview button on "status-service:health-check-started" in "status-application-health-change"
    Then the user views Preview an email template modal
    # Future work: need in-depth research on test automation with Monaco-editor before we can automate test steps.
    # When the user attempts to edit the template
    # Then the user gets "Cannot edit in read-only editor"
    When the user clicks Close button in Preview an email template modal
    Then Preview an email template modal is closed
    # Verify the event is still there (had a bug of the event disappearing after preview)
    And the user "views" the event of "status-service:health-check-started" in "status-application-health-change"
  @TEST_CS-986 @REQ_CS-963 @REQ_CS-978 @regression
  Scenario: As a tenant admin, I can see notification type for application status change updates, so I am aware of this notification type
    Given a tenant admin is on Notifications page
    Then the user should see tabs "Overview"
    And "Notifications types" tab
    When the user clicks "Notifications types"
    Then the user "views" "status-application-status-change" notification type for "status-application-status-change" notification type
    And the user "views" registered events "status-service:application-status-changed" for "status-application-status-change" notification type
    And the user "views" email template indicator for "status-service:application-status-changed" for "status-application-status-change" notification type
    And the user "views" registered events "status-service:application-notice-published" for "status-application-status-change" notification type
    And the user "views" email template indicator for "status-service:application-notice-published" for "status-application-status-change" notification type
    When the user clicks "Preview" button on "status-service:application-status-changed" for "status-application-status-change" notification type
    Then the user views "Preview an email template" modal
    And the user views "{{ event.payload.applicationName }} status has changed" in Subject field
    And the user views "The original status was: {{ event.payload.originalStatus }}" in Body field
    And the user views "The new status is now: {{ event.payload.newStatus }}" in Body field
    When the user attempts to edit the template
    Then the user gets "Cannot edit in read-only editor"
    When the user clicks "Close" button
    Then "Preview an email template" template is closed
    And "status-service:application-status-changed" should display under "status-application-status-change" notification
    When the user clicks "Preview" button on "status-service:application-notice-published" for "status-application-status-change" notification type
    Then the user views "Preview an email template" modal
    And the user views "A notice for {{ event.payload.application.name }} was published" in Subject field
    And the user views "The notice is described as follows: {{ event.payload.description }}" in Body field
    And the user views "The notice is related to the following tenant: {{  event.payload.postBy.tenantName }}" in Body field
    When the user attempts to edit the template
    Then the user gets "Cannot edit in read-only editor"
    When the user clicks "Close" button
    Then "Preview an email template" template is closed
    And "status-service:application-notice-published" should display under "status-application-status-change" notification