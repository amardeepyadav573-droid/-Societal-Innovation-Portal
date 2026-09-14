export const appendFormData = (
  formData,
  data,
  parentKey = ""
) => {
  if (
    data === null ||
    data === undefined
  ) {
    return;
  }

  if (
    data instanceof File
  ) {
    formData.append(
      parentKey,
      data
    );

    return;
  }

  if (
    typeof data !== "object"
  ) {
    formData.append(
      parentKey,
      String(data)
    );

    return;
  }

  if (Array.isArray(data)) {
    data.forEach(
      (item, index) => {
        appendFormData(
          formData,
          item,
          `${parentKey}[${index}]`
        );
      }
    );

    return;
  }

  Object.entries(data).forEach(
    ([key, value]) => {
      const fieldName =
        parentKey
          ? `${parentKey}[${key}]`
          : key;

      appendFormData(
        formData,
        value,
        fieldName
      );
    }
  );
};