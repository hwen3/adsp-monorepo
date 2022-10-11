@script
Feature: Script

  @TEST_CS-1741 @REQ_CS-1656 @REQ_CS-1658 @regression
  Scenario: As a tenant admin, I can add and delete a script
    Given a tenant admin user is on script service overview page
    When the user clicks Add script button
    Then the user views Add script modal
    # Invalid data
    When the user enters "auto-test-1-$" in name field in script modal
    Then the user views the error message of "Allowed characters are: a-z, A-Z, 0-9, -, [space]" on namespace in script modal
    # Validate data
    When the user enters "autotest-adddeletescript", "autotest script desc", "yes", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin" in Add script modal
    And the user clicks Save button in Add script modal
    Then the user "views" the script of "autotest-adddeletescript", "autotest script desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin"
    # Delete
    When the user clicks "Delete" button for the script of "autotest-adddeletescript", "autotest script desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin"
    Then the user views delete "script" confirmation modal for "autotest-adddeletescript"
    When the user clicks Delete button in delete confirmation modal
    Then the user "should not view" the script of "autotest-adddeletescript", "autotest script desc", "auto-test-role1, urn:ads:autotest:chat-service:chat-admin"

  @TEST_CS-1739 @REQ_CS-1655 @regression
  Scenario: As a tenant admin, I can see the overview for a script service, so I know about the service
    Given a tenant admin user is on script service overview page
    Then the user views the "Script service" overview content "The script services provides"
    And the user views the link of API docs for "Script service"
    And the user views the link of See the code for "script-service"
    And the user views the link of "Get support" under Support