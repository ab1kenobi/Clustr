import { Image, type ImageProps, type ImageSource } from "expo-image";
import { useEffect, useMemo, useState } from "react";

const fallbackImage = require("@/assets/images/firstLogo.png");

type SmartImageProps = Omit<ImageProps, "source"> & {
  uri?: string | null;
  fallback?: ImageSource;
};

export function SmartImage({
  uri,
  fallback = fallbackImage,
  contentFit = "cover",
  transition = 180,
  ...props
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const trimmedUri = uri?.trim();

  useEffect(() => {
    setFailed(false);
  }, [trimmedUri]);

  const source = useMemo(() => {
    if (!failed && trimmedUri) {
      return { uri: trimmedUri };
    }

    return fallback;
  }, [failed, fallback, trimmedUri]);

  return (
    <Image
      {...props}
      source={source}
      contentFit={contentFit}
      transition={transition}
      onError={() => setFailed(true)}
    />
  );
}
