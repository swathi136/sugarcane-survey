export function averageFilledObservations(values) {
  const filled = (Array.isArray(values) ? values : [])
    .filter((value) => value !== "" && value !== null && value !== undefined)
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (filled.length === 0) return null;
  return Number((filled.reduce((sum, value) => sum + value, 0) / filled.length).toFixed(2));
}

export function buildObservationRows({ mainEntryId, locationId, observationDay, observationDate, fertigationDate, userId, fields }) {
  return Array.from({ length: 5 }, (_, index) => {
    const row = {
      main_entry_id: mainEntryId,
      location_id: locationId,
      observation_day: observationDay,
      observation_no: index + 1,
      observation_date: observationDate,
      fertigation_date: fertigationDate,
      created_by: userId,
    };

    fields.forEach(({ fieldName, values }) => {
      const rawValue = values[index];
      if (rawValue === "" || rawValue === null || rawValue === undefined) {
        row[fieldName] = null;
        return;
      }
      const value = Number(rawValue);
      row[fieldName] = Number.isFinite(value) && value >= 0 ? value : null;
    });

    return row;
  });
}
