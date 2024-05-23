//------------------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------------------
export default class Version {
    constructor(strVersion) {
        const regex = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;
        const results = regex.exec(strVersion);

        // if no match, default to version 0.0.0
        if (results === null) {
            results = regex.exec("0.0.0");
        }

        this.major = parseInt(results[1] || 0, 10);
        this.minor = parseInt(results[2] || 0, 10);
        this.rev = parseInt(results[3] || 0, 10);
    }

    toString() {
        return this.major + "." + this.minor + "." + this.rev;
    }

    // returns -1 if this < otherVersion, 0 if this == otherVersion, and +1 if otherVersion < this
    compare(otherVersion) {
        if (this.major !== otherVersion.major) {
            return this.major - otherVersion.major;
        }

        if (this.minor !== otherVersion.minor) {
            return this.minor - otherVersion.minor;
        }

        return this.rev - otherVersion.rev;
    }
}
