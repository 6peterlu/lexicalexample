export function capitalize(input: string) {
  return `${input[0].toUpperCase()}${input
    .slice(1)
    .toLowerCase()}`;
}

export function getTitleString(input: string) {
  return `${input} | Draft Zero`;
}

export function pluralSuffix(count: number) {
  return count === 1 ? '' : 's';
}

export function convertPxStringToNumber(pxString: string) {
  return Number(pxString.replace('px', ''));
}

// alphanumeric only
export function validateUsername(username: string) {
  const VALID_USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
  return VALID_USERNAME_REGEX.test(username);
}

// alphabet only
export function validateName(name: string) {
  const VALID_NAME_REGEX = /^[a-zA-Z]+$/g;
  return VALID_NAME_REGEX.test(name);
}

// alphanumeric and dash only
export function validateSlug(slug: string) {
  const VALID_SLUG_REGEX = /^[a-zA-Z0-9-]+$/;
  return VALID_SLUG_REGEX.test(slug);
}

export function getFullNameString(
  firstName: string,
  lastName?: string
) {
  if (lastName) {
    return `${firstName} ${lastName}`;
  }
  return firstName;
}

export function getFullLocationString(
  city?: string,
  country?: string
) {
  if (city) {
    if (country) {
      return `${city}, ${country}`;
    }
    return city;
  }
  if (country) {
    return country;
  }
}

export function hashCode(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
