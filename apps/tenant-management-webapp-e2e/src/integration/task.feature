@task
Feature: Task

  @TEST_CS-2391 @TEST_CS-2397 @TEST_CS-2433 @TEST_CS-2408 @TEST_CS-2350 @REQ_CS-1748 @REQ_CS-1749 @REQ_CS-1750 @regression
  Scenario: As a tenant admin, I can add and delete a task queue
    Given a tenant admin user is on task service overview page
    When the user clicks Add queue button on task service overview page
    Then the user views Add queue modal
    When the user clicks Cancel button in Add queue modal
    Then the user views Queues page
    # Invalid data
    When the user clicks Add queue button on Queues page
    When the user enters "autotest", "auto-test-1-$" in Add queue modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" for Name field in Add queue modal
    # Validate data
    When the user enters "autotest", "addEditDeleteQueue" in Add queue modal
    And the user clicks Save button in Add queue modal
    Then the user views Queue page for "autotest", "addEditDeleteQueue"
    When the user enters "auto-test-role1" as Assigner roles and "empty" as Worker roles
    And the user clicks Save button on Queue page
    Then the user "views" the queue of "autotest", "addEditDeleteQueue", "auto-test-role1", "empty"
    # Edit and back
    When the user clicks "Edit" button for the queue of "autotest", "addEditDeleteQueue", "auto-test-role1", "empty"
    Then the user views Queue page for "autotest", "addEditDeleteQueue"
    When the user enters "auto-test-role2" as Assigner roles and "auto-test-role2, urn:ads:autotest:chat-service:chat-admin" as Worker roles
    And the user clicks Back button on Queue page
    And the user clicks "Don't save" button on unsaved changes modal
    Then the user "views" the queue of "autotest", "addEditDeleteQueue", "auto-test-role1", "empty"
    # Edit and save
    When the user clicks "Edit" button for the queue of "autotest", "addEditDeleteQueue", "auto-test-role1", "empty"
    Then the user views Queue page for "autotest", "addEditDeleteQueue"
    When the user enters "auto-test-role2" as Assigner roles and "auto-test-role2, urn:ads:autotest:chat-service:chat-admin" as Worker roles
    And the user clicks Save button on Queue page
    Then the user "views" the queue of "autotest", "addEditDeleteQueue", "auto-test-role2", "auto-test-role2, urn:ads:autotest:chat-service:chat-admin"
    # Delete
    When the user clicks "Delete" button for the queue of "autotest", "addEditDeleteQueue", "auto-test-role2", "auto-test-role2, urn:ads:autotest:chat-service:chat-admin"
    Then the user views delete "task queue" confirmation modal for "addEditDeleteQueue"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the queue of "autotest", "addEditDeleteQueue", "auto-test-role2", "auto-test-role2, urn:ads:autotest:chat-service:chat-admin"
