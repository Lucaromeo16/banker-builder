import { useMemo, useState } from 'react';
import businessSchools from '../../../data/businessSchools.json';
import { OTHER_SCHOOL_ID, findSchoolById, schoolDisplayName, schoolMatchesSearch } from '../schoolScoring';

export default function SchoolAutocomplete({ value, onChange }) {
  const [searchTerm, setSearchTerm] = useState(() => schoolDisplayName(value));
  const [isOpen, setIsOpen] = useState(false);
  const selectedName = schoolDisplayName(value);
  const otherSchool = findSchoolById(OTHER_SCHOOL_ID);

  const matchingSchools = useMemo(() => {
    const query = searchTerm.trim();
    if (!query) return businessSchools.filter((school) => school.id !== OTHER_SCHOOL_ID).slice(0, 8);

    return businessSchools
      .filter((school) => school.id !== OTHER_SCHOOL_ID && schoolMatchesSearch(school, query))
      .slice(0, 8);
  }, [searchTerm]);

  const selectSchool = (school) => {
    onChange(school);
    setSearchTerm(schoolDisplayName(school));
    setIsOpen(false);
  };

  const handleSearchChange = (nextValue) => {
    setSearchTerm(nextValue);
    setIsOpen(true);

    if (nextValue !== selectedName) {
      onChange(null);
    }
  };

  return (
    <div className="school-autocomplete">
      <input
        type="search"
        value={searchTerm}
        placeholder="Search school, university, or short name..."
        autoComplete="off"
        onChange={(event) => handleSearchChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
      />

      {isOpen ? (
        <div className="school-autocomplete-menu">
          {matchingSchools.length ? (
            matchingSchools.map((school) => (
              <button
                type="button"
                key={school.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSchool(school)}
              >
                <strong>{school.name}</strong>
                <span>{school.shortName} · {school.state}</span>
              </button>
            ))
          ) : (
            <p>No matching school found.</p>
          )}

          {otherSchool ? (
            <button
              type="button"
              className="school-fallback-option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSchool(otherSchool)}
            >
              <strong>Other / Not Listed</strong>
              <span>Use conservative non-target weighting</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {value ? <p className="selected-school-chip">Selected: {schoolDisplayName(value)}</p> : null}
    </div>
  );
}
