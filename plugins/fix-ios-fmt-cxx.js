const { withPodfile } = require("expo/config-plugins");

const FMT_CXX_FIX = `
    fmt_base_header = File.join(__dir__, 'Pods', 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base_header)
      contents = File.read(fmt_base_header)
      patched = contents.gsub('#  define FMT_USE_CONSTEVAL 1', '#  define FMT_USE_CONSTEVAL 0')
      if patched != contents
        File.chmod(0644, fmt_base_header)
        File.write(fmt_base_header, patched)
      end
    end

    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'

      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
        definitions = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        definitions << 'FMT_USE_CONSTEVAL=0' unless definitions.include?('FMT_USE_CONSTEVAL=0')
      end
    end
`;

module.exports = function fixIosFmtCxx(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;

    if (contents.includes("target.name == 'fmt'")) {
      return config;
    }

    const marker = "    # This is necessary for Xcode 14, because it signs resource bundles by default";

    if (!contents.includes(marker)) {
      throw new Error("Could not find Podfile post_install marker for fmt C++ fix.");
    }

    config.modResults.contents = contents.replace(marker, `${FMT_CXX_FIX}\n${marker}`);

    return config;
  });
};
