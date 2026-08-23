# Release Notes Workflow

The repository generates release notes directly from GitHub commit and pull-request history. It uses GitHub’s native release-note generator so that published notes are derived from the changes merged since the previous release instead of hand-written from memory.

## Automatic Release Notes

Push an annotated or lightweight version tag that begins with `v`, such as `v1.4.0`. The **Generate Release Notes** workflow creates the corresponding GitHub Release and attaches notes generated from the repository history.

```bash
git tag v1.4.0
git push github v1.4.0
```

## Manual Release Notes

In the GitHub repository, open **Actions**, select **Generate Release Notes**, and choose **Run workflow**. Enter a new version tag and, optionally, the target commit or branch. The workflow creates the release and uses the same generated-note format.

## Release Quality Gate

Create a release only after the **CI & Quality Gate** workflow is passing for the intended commit. The release workflow has permission only to write GitHub release metadata; it does not change application secrets, production data, schedules, or deployment configuration.
