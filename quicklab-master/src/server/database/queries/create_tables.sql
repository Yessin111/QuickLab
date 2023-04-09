
-- TODO: [ISSUE #144] Check if special characters in names are stored correctly.
-- TODO: [ISSUE #144] Add efficient indexing.

CREATE TABLE IF NOT EXISTS Admins (
    id INT AUTO_INCREMENT,
    mailAddress VARCHAR(255) NOT NULL,
    gitlabUsername VARCHAR(255) NOT NULL,
    gitlabApiToken VARCHAR(255) NOT NULL,

    PRIMARY KEY (id)
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS Groups (
    id INT AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(255),
    description VARCHAR(255),
    subtype VARCHAR(255) NOT NULL, -- one of either [group, edition, course]
    parentGroupId INT, -- FK

    PRIMARY KEY (id),
    FOREIGN KEY (parentGroupId)
        REFERENCES Groups(id)
        ON DELETE CASCADE
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS Users (
    name VARCHAR(255) NOT NULL,
    mailAddress VARCHAR(255) NOT NULL,
    gitlabUsername VARCHAR(255) NOT NULL,

    PRIMARY KEY (gitlabUsername)
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS Repositories (
    id INT AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    groupId INT, -- FK
    repo VARCHAR(255),

    PRIMARY KEY (id),
    FOREIGN KEY (groupId)
        REFERENCES Groups(id)
        ON DELETE CASCADE
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS RepoSettings (
    groupId INT, -- FK
    importType VARCHAR(255),
    importUrl VARCHAR(255),
    deleteTags TINYINT(1),
    commitGitlabUserOnly TINYINT(1),
    rejectSecrets TINYINT(1),
    commitRegex VARCHAR(255),
    branchRegex VARCHAR(255),
    mailRegex VARCHAR(255),
    filenameRegex VARCHAR(255),

    PRIMARY KEY (groupId),
    FOREIGN KEY (groupId)
        REFERENCES Groups(id)
        ON DELETE CASCADE
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS TAs (
    gitlabUsername VARCHAR(255) NOT NULL,
    name VARCHAR(255),

    PRIMARY KEY (gitlabUsername)
) ENGINE=INNODB;

--
-- Tables for M:N relations
--

CREATE TABLE IF NOT EXISTS AdminPrivileges (
    id INT AUTO_INCREMENT,
    adminId INT NOT NULL, -- FK
    groupId INT NOT NULL, -- FK
    privilege VARCHAR(255), -- TODO: find out a good type for this

    PRIMARY KEY (id),
    FOREIGN KEY (adminId)
        REFERENCES Admins(id)
        ON DELETE CASCADE,
    FOREIGN KEY (groupId)
        REFERENCES Groups(id)
        ON DELETE CASCADE
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS UserPrivileges (
    userId VARCHAR(255) NOT NULL, -- FK
    groupId INT NOT NULL, -- FK
    edit TINYINT(1),
    work TINYINT(1),
    share TINYINT(1),
    subtype VARCHAR(255),


    PRIMARY KEY (userId, groupId),
    FOREIGN KEY (userId)
        REFERENCES Users (gitlabUsername)
        ON DELETE CASCADE,
    FOREIGN KEY (groupId)
        REFERENCES Groups(id)
        ON DELETE CASCADE
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS AvailableTAs (
    tGitlabUsername VARCHAR(255) NOT NULL, -- FK
    groupId INT NOT NULL, -- FK
    subtype VARCHAR(255) NOT NULL DEFAULT 'ta', -- {ta, head}

    PRIMARY KEY (tGitlabUsername, groupId),
    FOREIGN KEY (tGitlabUsername)
        REFERENCES TAs (gitlabUsername)
        ON DELETE CASCADE,
    FOREIGN KEY (groupId)
        REFERENCES Groups(id)
        ON DELETE CASCADE
) ENGINE=INNODB;
