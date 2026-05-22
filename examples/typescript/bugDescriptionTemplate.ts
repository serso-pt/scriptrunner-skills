{
const descriptionField = getFieldById("description")
const descriptionValue = descriptionField.getValue()

const isEmpty = descriptionValue == null ||
    (typeof descriptionValue !== "string" &&
     (!descriptionValue.content || descriptionValue.content.toString() === ""))

if (isEmpty) {
    descriptionField.setValue({
        version: 1,
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: "Steps to Reproduce",
                        marks: [{ type: "strong" }]
                    }
                ]
            },
            {
                type: "orderedList",
                content: [
                    {
                        type: "listItem",
                        content: [
                            {
                                type: "paragraph",
                                content: [{ type: "text", text: "Step 1" }]
                            }
                        ]
                    }
                ]
            },
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: "Expected Result",
                        marks: [{ type: "strong" }]
                    }
                ]
            },
            {
                type: "paragraph",
                content: [{ type: "text", text: "Describe the expected result here." }]
            },
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: "Actual Result",
                        marks: [{ type: "strong" }]
                    }
                ]
            },
            {
                type: "paragraph",
                content: [{ type: "text", text: "Describe the actual result here." }]
            },
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: "Environment",
                        marks: [{ type: "strong" }]
                    }
                ]
            },
            {
                type: "paragraph",
                content: [{ type: "text", text: "Describe the environment (OS, browser, version, etc.)." }]
            }
        ]
    })
}
}
