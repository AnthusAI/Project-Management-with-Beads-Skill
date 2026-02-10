Feature: Sync and inject Beads skill pointer
  Scenario: Sync writes skill and inject is idempotent
    Given a git-initialized temporary repository
    When I run beads-skill sync
    And I run beads-skill inject
    Then the skill file matches the packaged bytes
    And injecting again leaves AGENTS.md unchanged
