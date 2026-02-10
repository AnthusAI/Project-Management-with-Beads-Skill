Feature: Sync and inject Beads skill pointer
  @bdd
  Scenario: Sync writes skill and inject is idempotent
    Given a git-initialized temporary repository
    When I run agent-skills sync
    And I run agent-skills inject
    Then the skill file matches the packaged bytes
    And injecting again leaves AGENTS.md unchanged
