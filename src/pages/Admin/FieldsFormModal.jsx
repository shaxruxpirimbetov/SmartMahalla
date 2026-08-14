import { useState } from 'react';
import { compressImageFile } from '../../utils/imageCompress';

// Generic "render this field list, collect values, submit" modal - shared
// by every Admin save/detail form (EntityAdminPage's step-1 name-it modal,
// GeoEntityAdminPage's step-1 name-it AND step-2 statistics modal). One
// field-rendering implementation so text/select/textarea/image/number
// inputs behave identically everywhere instead of drifting between copies.
function FieldsFormModal({
  title,
  fields,
  sections,
  rayonOptions,
  mahallaOptions,
  initialValues,
  saving,
  error,
  submitLabel = 'Saqlash',
  cancelLabel = 'Bekor qilish',
  onCancel,
  onSubmit,
}) {
  const [values, setValues] = useState(() => ({
    ...Object.fromEntries(fields.map((f) => [f.name, f.default ?? ''])),
    ...initialValues,
  }));

  // Long "Kompleks Tahlil"-style forms (see entityModules.js
  // CORE_STATS_FIELDS) pass `sections` - a list of { key, label } tabs - and
  // tag each field with a matching `field.section`, so this renders as a
  // tabbed form instead of one long scrolling column. Callers that don't
  // pass `sections` (the plain name-it modals) keep the original flat
  // single-column layout untouched.
  const hasTabs = Array.isArray(sections) && sections.length > 0;
  const [activeTab, setActiveTab] = useState(() => sections?.[0]?.key);
  const visibleFields = hasTabs ? fields.filter((f) => f.section === activeTab) : fields;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  // The picked photo is downscaled/recompressed (see compressImageFile - a
  // raw phone photo can be several MB) and held as a base64 data URL
  // directly in the field's value, same as every other value here, for the
  // rest of this form's lifetime - both because that's exactly what an
  // in-form <img src> preview needs, and because api.js's createBusiness/
  // createFarmer convert it back into a real uploaded file (see
  // dataUrlToBlob in utils/imageCompress.js) right before the real POST.
  async function handleImageChange(name, file) {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setField(name, dataUrl);
    } catch {
      // Compression failed (unusual format the <img> decoder rejected,
      // etc.) - fall back to the raw file rather than losing the pick
      // entirely. Still works, just skips the size-safety net above.
      const reader = new FileReader();
      reader.onload = () => setField(name, reader.result);
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="admin-modal-backdrop">
      <div className={`admin-modal ${hasTabs ? 'admin-modal--wide' : ''}`.trim()}>
        <h3 className="admin-modal__title">{title}</h3>

        {hasTabs && (
          <div className="admin-modal__tabs" role="tablist">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                role="tab"
                aria-selected={activeTab === section.key}
                className={`admin-modal__tab ${activeTab === section.key ? 'is-active' : ''}`}
                onClick={() => setActiveTab(section.key)}
              >
                {section.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-modal__form">
          {visibleFields.map((field) => (
            <label key={field.name} className="admin-modal__field">
              <span>{field.label}</span>
              {field.type === 'select' ? (
                <select
                  value={values[field.name]}
                  onChange={(e) => setField(field.name, e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Tanlang
                  </option>
                  {(field.options ??
                    (field.optionsFrom === 'mahalla' ? mahallaOptions : rayonOptions) ??
                    []
                  ).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={values[field.name]}
                  onChange={(e) => setField(field.name, e.target.value)}
                  required={!field.optional}
                  rows={3}
                />
              ) : field.type === 'image' ? (
                <div className="admin-modal__image-field">
                  {values[field.name] && (
                    <img
                      src={values[field.name]}
                      alt=""
                      className="admin-modal__image-preview"
                    />
                  )}
                  <input
                    type="file"
                    accept={field.accept ?? 'image/png'}
                    onChange={(e) => handleImageChange(field.name, e.target.files?.[0])}
                    required={!field.optional && !values[field.name]}
                  />
                </div>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                  value={values[field.name]}
                  onChange={(e) => setField(field.name, e.target.value)}
                  autoFocus={field === visibleFields[0]}
                  required={!field.optional}
                  minLength={field.type === 'text' ? 3 : undefined}
                  step={field.type === 'number' ? 'any' : undefined}
                />
              )}
            </label>
          ))}

          {error && <p className="admin-modal__error">{error}</p>}

          <div className="admin-modal__actions">
            <button
              type="button"
              className="admin-modal__btn admin-modal__btn--ghost"
              onClick={onCancel}
              disabled={saving}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="admin-modal__btn admin-modal__btn--primary"
              disabled={saving}
            >
              {saving ? 'Saqlanmoqda...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FieldsFormModal;
