import com.adaptavist.hapi.cloud.jira.issues.Issues

def eventIssue = Issues.getByKey(issue.key as String)
def author = eventIssue.getCreator().displayName
eventIssue.addComment("Thank you ${author} for creating this issue. We'll respond within 24 hours.")
